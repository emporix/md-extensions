import {
  type ForwardedRef,
  type ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  DotIndicator,
  ProgressSpinner,
  Tree,
  useToast,
  type TreeDragDropEvent,
  type TreeNode,
  type TreeNodeTemplateOptions,
} from '@emporix/component-library'
import EmptyTable from '../shared/EmptyTable'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { useCategoryTreeApi } from '../../hooks/api/categoryTree'
import { useCategoryTreeRebuild } from '../../hooks/api/categoryTreeRebuild'
import { useCategoriesApi } from '../../hooks/api/categories'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import {
  Category,
  CategoryTree,
  CategoryType,
} from '../../models/Category.model'
import { EmployeeDomains } from '../../configs/accessControls'
import {
  type NewCategoryPlacement,
  findAncestorKeys,
  findInsertLocation,
  findNodeLocation,
  findRootKeyContaining,
  getInsertPositions,
  mapCategoryTreesToNodes,
  mapCategoryTreeToNode,
  relabelNodes,
  removeNode,
  replaceRootNodes,
} from './categoriesTree.helpers'
import {
  getCategoryMovePlacements,
  getCategoryMoveRootKeys,
} from './categoryTreeMove.helpers'
import styles from './CategoryTree.module.scss'

export interface CategoryTreeAsideProps {
  /** The selected category, as the tree currently shows it. */
  category?: CategoryTree
  /** The selected category and its siblings. */
  siblings: CategoryTree[]
  /** Updates a category, swaps its rebuilt tree in and reports the result. */
  saveCategory: (id: string, changes: Partial<Category>) => Promise<void>
  /**
   * Creates a category, adds it to the tree, reports the result and resolves
   * to its id.
   */
  createCategory: (
    category: Partial<Category>,
    placement: NewCategoryPlacement
  ) => Promise<string>
}

export interface CategoryTreeBaseProps {
  readonly type?: CategoryType
  readonly reorderable?: boolean
  readonly selectionMode?: 'single' | 'multiple' | 'checkbox'
  readonly selectionKeys?: string | { [key: string]: boolean } | null
  readonly isSelectable?: (category: CategoryTree) => boolean
  readonly onSelectCategory?: (category: CategoryTree) => void
  readonly nodeTemplate?: (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => ReactNode
  /** Rendered next to the tree, e.g. the details of the selected category. */
  readonly aside?: (props: CategoryTreeAsideProps) => ReactNode
}

export interface CategoryTreeBaseHandle {
  /** Deletes a category and drops it from the tree without reloading it. */
  deleteCategory: (id: string) => Promise<void>
}

/**
 * Ported from management-dashboard `components/categoriesTree/CategoryTreeBase`
 * (standard categories only; Classifications stay in MD).
 */
const CategoryTreeBase = (
  {
    type = CategoryType.STANDARD,
    reorderable = false,
    selectionMode,
    selectionKeys,
    isSelectable,
    onSelectCategory,
    nodeTemplate,
    aside,
  }: CategoryTreeBaseProps,
  ref: ForwardedRef<CategoryTreeBaseHandle>
) => {
  const { t } = useTranslation()
  const { tenant } = useDashboardContext()
  const { getCategoryTrees } = useCategoryTreeApi()
  const { rebuildRoots } = useCategoryTreeRebuild()
  const {
    patchCategory,
    getCategory,
    createCategory: createCategoryCall,
    deleteCategory: deleteCategoryCall,
  } = useCategoriesApi()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const { showSuccess, showError, showToast } = useToast()
  const { blockPanel } = useUIBlocker()
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  // Dragging saves the new order, so only managers can do it.
  const canReorder =
    reorderable && hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
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
    ;(async () => {
      try {
        setIsLoading(true)
        // MD's tree lists unpublished categories too (api-calls default).
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

  // Reveal a category selected only after the tree has loaded (the load
  // covers earlier ones).
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
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedKey, isLoading, scrollRequest])

  const patchCategoryFields = async (
    id: string,
    changes: Partial<Category>
  ) => {
    // The partial update requires the current version, which /category-trees omits.
    const { metadata } = await getCategory(id)
    await patchCategory({
      id,
      ...changes,
      metadata: { version: metadata?.version },
    } as Partial<Category>)
  }

  // Called after a change is saved, so a failed rebuild leaves only the tree
  // stale. `loadId` is the load the change began on: once a reload, e.g. for
  // another tenant, has replaced the tree, nothing is rebuilt or swapped in.
  // Resolves to whether the tree could be refreshed.
  const swapInRebuiltRoots = async (
    rootKeys: (string | null)[],
    loadId: number
  ) => {
    if (loadId !== loadIdRef.current) return true
    let rebuilt: CategoryTree[]
    try {
      rebuilt = await rebuildRoots(rootKeys)
    } catch (error) {
      console.error(error)
      return false
    }
    if (loadId === loadIdRef.current) {
      setTreeNodes((current) =>
        replaceRootNodes(
          current,
          rebuilt.map((tree) =>
            mapCategoryTreeToNode(tree, resolveLabelRef.current, isSelectable)
          )
        )
      )
    }
    return true
  }

  // For changes without a success toast of their own.
  const refreshRoots = async (rootKeys: (string | null)[], loadId: number) => {
    if (!(await swapInRebuiltRoots(rootKeys, loadId))) {
      showError(t('categories.actions.rebuild.error'), '')
    }
  }

  // One toast per change, as two shown at once replace each other; problems
  // that did not stop the change turn its success into a warning.
  const notifySaved = (title: string, problems: string[]) => {
    if (problems.length === 0) {
      showSuccess(title)
      return
    }
    showToast(
      title,
      <>
        {problems.map((problem) => (
          <div key={problem}>{problem}</div>
        ))}
      </>,
      'warn'
    )
  }

  const saveCategory = async (id: string, changes: Partial<Category>) => {
    const loadId = loadIdRef.current
    await patchCategoryFields(id, changes)
    const isTreeRefreshed = await swapInRebuiltRoots(
      [findRootKeyContaining(treeNodes, id)],
      loadId
    )
    notifySaved(
      t('categories.edit.toast.update.success'),
      isTreeRefreshed ? [] : [t('categories.actions.rebuild.error')]
    )
  }

  const createCategory = async (
    category: Partial<Category>,
    placement: NewCategoryPlacement
  ) => {
    const loadId = loadIdRef.current
    const location = findInsertLocation(treeNodes, placement)
    if (!location) {
      throw new Error(`Category ${placement.anchorId} is not in the tree`)
    }
    const parentId = location.parent ? String(location.parent.key) : undefined
    const { position, updates } = getInsertPositions(
      location.siblings.map(({ data }) => data as CategoryTree),
      location.index
    )
    const id = await createCategoryCall({
      ...category,
      type,
      parentId,
      position,
    })
    const problems: string[] = []
    // Every renumbering request settles before the rebuild, failed or not.
    const renumbered = await Promise.allSettled(
      updates.map((update) =>
        patchCategoryFields(update.id, { position: update.position })
      )
    )
    const failure = renumbered.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    if (failure) {
      // The category exists by now; only the order of its siblings is off.
      console.error(failure.reason)
      problems.push(t('categories.actions.move.error'))
    }
    // A new top-level category and renumbered ones are roots of their own trees.
    const isTreeRefreshed = await swapInRebuiltRoots(
      parentId
        ? [findRootKeyContaining(treeNodes, parentId)]
        : [id, ...updates.map((update) => update.id)],
      loadId
    )
    if (!isTreeRefreshed) {
      problems.push(t('categories.actions.rebuild.error'))
    }
    notifySaved(t('categories.edit.toast.create.success'), problems)
    if (parentId) {
      setExpandedKeys((current) => ({ ...current, [parentId]: true }))
    }
    return id
  }

  // /category-trees still lists a deleted root for a few seconds, so the
  // tree is updated in place instead of being reloaded.
  const deleteCategory = async (id: string) => {
    const loadId = loadIdRef.current
    const rootKey = findRootKeyContaining(treeNodes, id)
    // Only a category of the tree on screen, not one of a previous tenant.
    if (!rootKey) {
      throw new Error(`Category ${id} is not in the tree`)
    }
    await deleteCategoryCall(id)
    if (loadId === loadIdRef.current) {
      setTreeNodes((current) => removeNode(current, id))
    }
    if (rootKey && rootKey !== id) {
      await refreshRoots([rootKey], loadId)
    }
  }

  // MD `handleDragDrop`. The moved node is found by `dragNode.key` in the
  // rebuilt tree; Prime's raw `dropIndex` is not used.
  const moveCategory = async (event: TreeDragDropEvent) => {
    // A viewer cannot drag; this guards a drop that reaches here regardless.
    if (!canReorder) return
    const loadId = loadIdRef.current
    const previous = treeNodes
    const newTree = event.value
    const dragKey = String(event.dragNode.key)

    const placements = getCategoryMovePlacements(previous, newTree, dragKey)
    if (!placements) return

    setTreeNodes(newTree)
    if (placements.size === 0) return

    blockPanel(true)
    try {
      const ids = [...placements.keys()]
      const results = await Promise.allSettled(
        [...placements].map(([id, placement]) =>
          patchCategoryFields(id, placement)
        )
      )
      const failedIds = new Set(
        ids.filter((_, index) => results[index].status === 'rejected')
      )
      if (failedIds.size > 0) {
        results.forEach((result) => {
          if (result.status === 'rejected') console.error(result.reason)
        })
        showError(t('categories.actions.move.error'), '')
      }
      if (failedIds.size === ids.length) {
        // Nothing was saved, so the drop is undone, unless a reload, e.g. for
        // another tenant, has replaced the tree.
        if (loadId === loadIdRef.current) {
          setTreeNodes(previous)
        }
        return
      }
      await refreshRoots(
        getCategoryMoveRootKeys(previous, newTree, dragKey, ids, failedIds),
        loadId
      )
    } finally {
      blockPanel(false)
    }
  }

  useImperativeHandle(ref, () => ({ deleteCategory }))

  const defaultNodeTemplate = (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => (
    <div className={styles.defaultNode}>
      <DotIndicator value={!!node.data?.published} />
      <span className={options.className}>{node.label}</span>
    </div>
  )

  if (!canViewCategories) {
    return <EmptyTable text={t('global.noPermissions')} />
  }

  const tree = isLoading ? (
    <ProgressSpinner />
  ) : (
    <Tree
      value={treeNodes}
      className={styles.tree}
      compact
      borderless
      selectionMode={selectionMode}
      selectionKeys={selectionKeys}
      expandedKeys={expandedKeys}
      onToggle={(e) => setExpandedKeys(e.value)}
      onSelect={(e) => onSelectCategory?.(e.node.data as CategoryTree)}
      nodeTemplate={nodeTemplate ?? defaultNodeTemplate}
      // Dragging saves the new order, so only managers can do it.
      dragdropScope={canReorder ? 'categories' : undefined}
      onDragDrop={canReorder ? (event) => void moveCategory(event) : undefined}
      data-testid="categories-tree"
    />
  )

  if (!aside) {
    return (
      <div ref={treeWrapperRef} className={styles.treeWrapper}>
        {tree}
      </div>
    )
  }

  const selected = selectedKey ? findNodeLocation(treeNodes, selectedKey) : null

  return (
    <div className={styles.split}>
      <div
        ref={treeWrapperRef}
        className={`${styles.treeWrapper} ${styles.splitTree}`}
      >
        {tree}
      </div>
      <div className={styles.splitAside}>
        {aside({
          category: selected?.siblings[selected.index].data,
          siblings:
            selected?.siblings.map(({ data }) => data as CategoryTree) ?? [],
          saveCategory,
          createCategory,
        })}
      </div>
    </div>
  )
}

export default forwardRef(CategoryTreeBase)
