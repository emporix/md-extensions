import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ProgressSpinner,
  Tree,
  type TreeNode,
  type TreeNodeTemplateOptions,
  type TreeSelectionKeys,
  useToast,
} from '@emporix/component-library'
import { DotIndicator } from '../shared/DotIndicator'
import EmptyTable from '../shared/EmptyTable'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { useCategoryTreeApi } from '../../hooks/api/categoryTree'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { CategoryTree, CategoryType } from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import {
  findAncestorKeys,
  mapCategoryTreesToNodes,
  relabelNodes,
} from './categoriesTree.helpers'
import styles from './CategoryTreeBase.module.scss'

/**
 * MD `CategoryTreeBase`: the whole tree from one `/category-trees` request.
 * MD's editing (drag and drop, the side panel, create / save / delete with
 * tree rebuilds) serves the categories and classifications modules only, so
 * it is not ported, with its `reorderable` / `aside` props and ref handle.
 */
export interface CategoryTreeBaseProps {
  readonly type?: CategoryType
  readonly selectionMode?: 'single' | 'multiple' | 'checkbox'
  readonly selectionKeys?: TreeSelectionKeys
  readonly isSelectable?: (category: CategoryTree) => boolean
  readonly onSelectCategory?: (category: CategoryTree) => void
  readonly nodeTemplate?: (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => ReactNode
}

const CategoryTreeBase = ({
  type = CategoryType.STANDARD,
  selectionMode,
  selectionKeys,
  isSelectable,
  onSelectCategory,
  nodeTemplate,
}: CategoryTreeBaseProps) => {
  const { t } = useTranslation()
  const { tenant } = useDashboardContext()
  const { getCategoryTrees } = useCategoryTreeApi()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const { showError } = useToast()
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const selectedKey =
    typeof selectionKeys === 'string' ? selectionKeys : undefined

  const [isLoading, setIsLoading] = useState(false)
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  // Controlled, so the branch of the selected category can be opened on load.
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})
  // Bumped when a branch is opened for the selected category, so the category
  // is scrolled into view once the branch has rendered it.
  const [scrollRequest, setScrollRequest] = useState(0)
  const treeWrapperRef = useRef<HTMLDivElement>(null)
  // Bumped by every load, so results for an earlier tenant or type are dropped.
  const loadIdRef = useRef(0)
  // The current label resolver, for responses that land after a content
  // language switch (the relabel below only covers the nodes already shown).
  const resolveLabelRef = useRef(getContentLangValue)

  useEffect(() => {
    resolveLabelRef.current = getContentLangValue
  }, [getContentLangValue])

  useEffect(() => {
    const loadId = ++loadIdRef.current
    // Nothing from an earlier tenant or type stays usable, even if this fails
    // or there is no tenant to load for.
    setTreeNodes([])
    if (!canViewCategories || !tenant) {
      setIsLoading(false)
      return
    }
    void (async () => {
      try {
        setIsLoading(true)
        const trees = await getCategoryTrees({ type })
        if (loadId !== loadIdRef.current) return
        const nodes = mapCategoryTreesToNodes(
          trees,
          resolveLabelRef.current,
          isSelectable
        )
        setTreeNodes(nodes)
        // Reveal the selected category, e.g. after coming back from its page.
        const ancestorKeys = selectedKey
          ? findAncestorKeys(nodes, selectedKey)
          : null
        if (ancestorKeys?.length) {
          setExpandedKeys((current) => ({
            ...current,
            ...Object.fromEntries(ancestorKeys.map((key) => [key, true])),
          }))
        }
      } catch (e) {
        if (loadId !== loadIdRef.current) return
        console.error(e)
        showError(t('categories.title'), '')
      } finally {
        if (loadId === loadIdRef.current) {
          setIsLoading(false)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, canViewCategories, type])

  // Labels follow the content language without reloading the tree.
  useUpdateEffect(() => {
    setTreeNodes((current) => relabelNodes(current, getContentLangValue))
  }, [getContentLangValue])

  // Reveal a category selected only after the tree has loaded, e.g. once its
  // products come back after the list view (the load covers earlier ones).
  useEffect(() => {
    if (!selectedKey || isLoading) return
    const ancestorKeys = findAncestorKeys(treeNodes, selectedKey)
    if (!ancestorKeys?.length || ancestorKeys.every((key) => expandedKeys[key]))
      return
    setExpandedKeys((current) => ({
      ...current,
      ...Object.fromEntries(ancestorKeys.map((key) => [key, true])),
    }))
    setScrollRequest((request) => request + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, isLoading])

  // Bring the selected category into view, e.g. one just added at the end.
  useEffect(() => {
    if (!selectedKey) return
    treeWrapperRef.current
      ?.querySelector('.p-treenode-content.p-highlight')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedKey, isLoading, scrollRequest])

  const defaultNodeTemplate = (node: TreeNode) => (
    <div className={styles.node}>
      <DotIndicator value={Boolean(node.data?.published)} />
      <span>{node.label}</span>
    </div>
  )

  if (!canViewCategories) {
    return (
      <EmptyTable
        text={t('global.noPermissions')}
        className={styles.noPermissionTable}
      />
    )
  }

  return (
    <div ref={treeWrapperRef} className={styles.wrapper}>
      {isLoading ? (
        <ProgressSpinner />
      ) : (
        <Tree
          value={treeNodes}
          borderless
          selectionMode={selectionMode}
          selectionKeys={selectionKeys}
          expandedKeys={expandedKeys}
          onToggle={(e) => setExpandedKeys(e.value)}
          onSelect={(e) => onSelectCategory?.(e.node.data as CategoryTree)}
          nodeTemplate={nodeTemplate ?? defaultNodeTemplate}
        />
      )}
    </div>
  )
}

export default CategoryTreeBase
