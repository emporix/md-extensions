import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  Tree,
  type TreeNode,
  type TreeNodeEvent,
  type TreeNodeTemplateOptions,
} from '@emporix/component-library'
import { Category, CategoryType } from '../../models/Category.model'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { DotIndicator } from './DotIndicator'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import EmptyTable from './EmptyTable'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { findFirstCategory, replaceInTree } from './categoriesTree.helpers'
import styles from './CategoriesTree.module.scss'

const byPosition = (a: TreeNode, b: TreeNode) =>
  (a.data?.position || 0) - (b.data?.position || 0)

type CategoryWithChildrenFlag = Category & { hasChildren: boolean }

/**
 * Category tree with lazily loaded children (MD `CategoriesTree`, tree mode).
 * MD's `table` (TreeTable) mode is not used by the products module and was
 * dropped with its reorder / multiple-selection props.
 */
type CategoriesTreeProps = {
  readonly selectedNodeKeys: string | null
  readonly selectHandler?: (nodeId: string) => void
  readonly treeNodeTemplate?: (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => ReactNode
  readonly type?: CategoryType
}

const CategoriesTree = ({
  selectedNodeKeys,
  selectHandler,
  treeNodeTemplate,
  type = CategoryType.STANDARD,
}: CategoriesTreeProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TreeNode[]>([])
  const { tenant } = useDashboardContext()
  const { refresh, setRefreshValue } = useRefresh()
  const { getAllCategories, getSubCategories } = useCategoriesApi()
  const { getContentLangValue } = useLocalizedValue()
  const { contentLanguage } = useConfiguration()
  const { hasPermission } = usePermissions()
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)

  useEffect(() => {
    setRefreshValue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentLanguage])

  const mapRootCategoryToPrime = useCallback(
    (category: Category): TreeNode => {
      const rootNode: TreeNode = {
        key: category.id,
        label: getContentLangValue(category.localizedName),
        data: category,
        leaf: category.children === undefined || category.children.length === 0,
      }
      if (category.children && category.children.length > 0) {
        rootNode.children = category.children.map((child) => ({
          key: child.id,
          label: getContentLangValue(child.localizedName),
          data: { ...child },
          leaf: child.leaf === true,
          children: [],
        }))
      }
      return rootNode
    },
    [getContentLangValue]
  )

  /** Fetches direct children and flags whether each has children itself. */
  const fetchChildrenWithExpandability = useCallback(
    async (categoryId: string): Promise<CategoryWithChildrenFlag[]> => {
      const children = await getSubCategories(categoryId, 1)
      return Promise.all(
        children.map(async (child) => {
          try {
            const grandChildren = await getSubCategories(child.id, 1)
            return { ...child, hasChildren: grandChildren.length > 0 }
          } catch {
            // If fetch fails, assume no children
            return { ...child, hasChildren: false }
          }
        })
      )
    },
    [getSubCategories]
  )

  // Track previous refresh value to detect actual refresh triggers
  const prevRefreshRef = useRef(refresh)

  useEffect(() => {
    void (async () => {
      if (!canViewCategories) return
      // Only reload if categories are empty or if refresh actually changed
      // Don't reload just because the component re-renders
      const refreshChanged = prevRefreshRef.current !== refresh
      if (categories.length > 0 && !refreshChanged) {
        prevRefreshRef.current = refresh
        return
      }
      prevRefreshRef.current = refresh
      try {
        setIsLoading(true)
        const categoriesData = await getAllCategories(
          undefined,
          type,
          true,
          true
        )
        const categoriesTree: TreeNode[] = []
        await Promise.all(
          categoriesData
            .sort((a, b) => a.position - b.position)
            .map(async (category: Category) => {
              try {
                const childrenWithSubcategories =
                  await fetchChildrenWithExpandability(category.id)
                category.children = childrenWithSubcategories
                  .sort((a, b) => a.position - b.position)
                  .map((child) => ({
                    ...child,
                    children: undefined, // Don't pre-load children
                    leaf: !child.hasChildren,
                  }))
                category.leaf = childrenWithSubcategories.length === 0
                categoriesTree.push(mapRootCategoryToPrime(category))
              } catch {
                category.children = []
                category.leaf = true
                categoriesTree.push(mapRootCategoryToPrime(category))
              }
            })
        )
        // Preserve loaded children from existing tree if reloading
        if (categories.length > 0 && refreshChanged) {
          const mergeChildren = (
            existingNode: TreeNode | undefined,
            newNode: TreeNode
          ): TreeNode => {
            if (existingNode?.children && existingNode.children.length > 0) {
              // Preserve existing children, but update node data
              const mergedChildren = existingNode.children.map(
                (existingChild) => {
                  const matchingNewChild = newNode.children?.find(
                    (nc) => nc.key === existingChild.key
                  )
                  return matchingNewChild
                    ? mergeChildren(existingChild, matchingNewChild)
                    : existingChild
                }
              )
              return { ...newNode, children: mergedChildren.sort(byPosition) }
            }
            return newNode
          }

          categoriesTree.forEach((newRoot, index) => {
            const existingRoot = categories.find((cr) => cr.key === newRoot.key)
            if (existingRoot) {
              categoriesTree[index] = mergeChildren(existingRoot, newRoot)
            }
          })
        }

        const sortedCategories = categoriesTree.sort(byPosition)
        setCategories(sortedCategories)
        const firstCategoryId = categoriesTree[0]
          ? findFirstCategory(categoriesTree[0])
          : null
        if (firstCategoryId && selectHandler && !selectedNodeKeys) {
          selectHandler(firstCategoryId)
        }
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tenant,
    refresh,
    canViewCategories,
    mapRootCategoryToPrime,
    selectHandler,
    getSubCategories,
  ])

  const propagateSubCategories = async (node: TreeNode) => {
    const lazyNode: TreeNode = { ...node }
    try {
      const children = await fetchChildrenWithExpandability(String(node.key))
      if (children.length === 0) {
        lazyNode.children = []
        lazyNode.leaf = true
      } else {
        lazyNode.children = children
          .sort((a, b) => a.position - b.position)
          .map((child) => ({
            key: child.id,
            label: getContentLangValue(child.localizedName),
            data: { ...child },
            leaf: !child.hasChildren,
            children: [], // fetched on expand
          }))
        lazyNode.leaf = false
      }
    } catch {
      // On error, mark as leaf (no children)
      lazyNode.children = []
      lazyNode.leaf = true
    }
    const nodes = [...categories]
    replaceInTree(nodes, lazyNode)
    setCategories(nodes)
  }

  const expandHandler = async ({ node }: TreeNodeEvent) => {
    // Children not fetched yet: `leaf: false` with an empty children array.
    if (!node.leaf && node.children && node.children.length === 0) {
      await propagateSubCategories(node)
    }
  }

  const defaultNodeTemplate = (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => (
    <div className={`${options.className} ${styles.node}`}>
      <DotIndicator value={Boolean(node.data?.published)} />
      <div className={styles.nodeLabel}>{node.label}</div>
    </div>
  )

  const sortedCategories = useMemo(
    () => [...categories].sort(byPosition),
    [categories]
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
    <Tree
      value={sortedCategories}
      selectionMode="single"
      onExpand={(event) => void expandHandler(event)}
      onSelect={({ node }) => {
        if (selectHandler) {
          selectHandler(node.data.id)
        }
      }}
      selectionKeys={selectedNodeKeys}
      loading={isLoading}
      nodeTemplate={treeNodeTemplate ?? defaultNodeTemplate}
    />
  )
}

export default CategoriesTree
