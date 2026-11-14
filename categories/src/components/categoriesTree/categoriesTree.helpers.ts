import type { TreeNode } from '@emporix/component-library'
import { CategoryTree } from '../../models/Category.model'
import { LocalizedInput } from '../../hooks/useLocalizedValue'

type LabelResolver = (value: LocalizedInput) => string
type SelectablePredicate = (category: CategoryTree) => boolean

export const mapCategoryTreeToNode = (
  category: CategoryTree,
  resolveLabel: LabelResolver,
  isSelectable?: SelectablePredicate
): TreeNode => {
  const subcategories = [...(category.subcategories ?? [])].sort(
    (a, b) => a.position - b.position
  )
  const node: TreeNode = {
    key: category.id,
    label: resolveLabel(category.localizedName),
    data: category,
    leaf: subcategories.length === 0,
    children: subcategories.map((child) =>
      mapCategoryTreeToNode(child, resolveLabel, isSelectable)
    ),
  }
  if (isSelectable) {
    node.selectable = isSelectable(category)
  }
  return node
}

/** Resolves every label again, e.g. after the content language changed. */
export const relabelNodes = (
  nodes: TreeNode[],
  resolveLabel: LabelResolver
): TreeNode[] =>
  nodes.map((node) => ({
    ...node,
    label: resolveLabel((node.data as CategoryTree).localizedName),
    children: node.children && relabelNodes(node.children, resolveLabel),
  }))

export const mapCategoryTreesToNodes = (
  categories: CategoryTree[],
  resolveLabel: LabelResolver,
  isSelectable?: SelectablePredicate
): TreeNode[] =>
  [...categories]
    .sort((a, b) => a.position - b.position)
    .map((category) =>
      mapCategoryTreeToNode(category, resolveLabel, isSelectable)
    )

export interface NodeLocation {
  parent: TreeNode | null
  siblings: TreeNode[]
  index: number
}

// Finds a node by key in a tree, returning its parent, sibling list and index.
export const findNodeLocation = (
  nodes: TreeNode[],
  key: string,
  parent: TreeNode | null = null
): NodeLocation | null => {
  const index = nodes.findIndex((n) => String(n.key) === key)
  if (index !== -1) {
    return { parent, siblings: nodes, index }
  }
  for (const node of nodes) {
    const children = node.children as TreeNode[] | undefined
    if (children?.length) {
      const found = findNodeLocation(children, key, node)
      if (found) {
        return found
      }
    }
  }
  return null
}

// Returns the key of the top-level (root) node whose subtree contains `key`
export const findRootKeyContaining = (
  nodes: TreeNode[],
  key: string
): string | null => {
  const contains = (node: TreeNode): boolean =>
    String(node.key) === key ||
    ((node.children as TreeNode[] | undefined)?.some(contains) ?? false)
  const root = nodes.find(contains)
  return root ? String(root.key) : null
}

// Keys of the nodes above `key`, root first; null when `key` is not in the tree.
export const findAncestorKeys = (
  nodes: TreeNode[],
  key: string
): string[] | null => {
  for (const node of nodes) {
    if (String(node.key) === key) {
      return []
    }
    const path = findAncestorKeys(
      (node.children as TreeNode[] | undefined) ?? [],
      key
    )
    if (path) {
      return [String(node.key), ...path]
    }
  }
  return null
}

// Drops the node with `key` and its subtree; a parent left without children
// becomes a leaf.
export const removeNode = (nodes: TreeNode[], key: string): TreeNode[] =>
  nodes
    .filter((node) => String(node.key) !== key)
    .map((node) => {
      const children = node.children as TreeNode[] | undefined
      if (!children?.length) {
        return node
      }
      const remaining = removeNode(children, key)
      return { ...node, children: remaining, leaf: remaining.length === 0 }
    })

// Swaps the rebuilt roots in by key and adds the new ones. A root's own
// position may have changed, so the roots are sorted again; ties keep their
// current order.
export const replaceRootNodes = (
  roots: TreeNode[],
  rebuilt: TreeNode[]
): TreeNode[] => {
  const rebuiltByKey = new Map(rebuilt.map((node) => [String(node.key), node]))
  const rootKeys = new Set(roots.map((root) => String(root.key)))
  return [
    ...roots.map((root) => rebuiltByKey.get(String(root.key)) ?? root),
    ...rebuilt.filter((node) => !rootKeys.has(String(node.key))),
  ].sort(
    (a, b) =>
      (a.data as CategoryTree).position - (b.data as CategoryTree).position
  )
}

export type AddCategoryTarget = 'above' | 'child' | 'below'

export interface NewCategoryPlacement {
  target: AddCategoryTarget
  /** Without an anchor the new category goes last at the top level. */
  anchorId?: string
}

// Where a new category goes: its parent, its future siblings in display order
// and its index among them; null when the anchor is not in the tree.
export const findInsertLocation = (
  nodes: TreeNode[],
  { target, anchorId }: NewCategoryPlacement
): NodeLocation | null => {
  if (!anchorId) {
    return { parent: null, siblings: nodes, index: nodes.length }
  }
  const anchor = findNodeLocation(nodes, anchorId)
  if (!anchor) {
    return null
  }
  if (target === 'child') {
    const parent = anchor.siblings[anchor.index]
    const children = (parent.children as TreeNode[] | undefined) ?? []
    return { parent, siblings: children, index: children.length }
  }
  return {
    ...anchor,
    index: target === 'above' ? anchor.index : anchor.index + 1,
  }
}

export interface CategoryPositionUpdate {
  id: string
  position: number
}

// A position right after `previous`, or right before `next` at the start (0
// without neighbours), when the neighbours leave room for it.
const findFreePosition = (
  previous: number | undefined,
  next: number | undefined
): number | undefined => {
  const candidate = previous === undefined ? (next ?? 1) - 1 : previous + 1
  return candidate >= 0 && (next === undefined || candidate < next)
    ? candidate
    : undefined
}

// `position` is only a sort key: the API neither shifts siblings nor rejects
// duplicates. Give the moved category a free slot between its new neighbours,
// and renumber the siblings only when there is no gap left.
export const getPositionUpdates = (
  siblings: CategoryTree[],
  movedId: string
): CategoryPositionUpdate[] => {
  const index = siblings.findIndex((sibling) => sibling.id === movedId)
  if (index === -1) {
    return []
  }
  const current = siblings[index].position
  const previous: number | undefined = siblings[index - 1]?.position
  const next: number | undefined = siblings[index + 1]?.position

  const currentFits =
    (previous === undefined || current > previous) &&
    (next === undefined || current < next)
  if (currentFits) {
    return []
  }
  const freePosition = findFreePosition(previous, next)
  if (freePosition !== undefined) {
    return [{ id: movedId, position: freePosition }]
  }
  return siblings
    .map((sibling, position) => ({ id: sibling.id, position }))
    .filter(({ position }, i) => siblings[i].position !== position)
}

export interface CategoryInsertPositions {
  position: number
  /** Siblings renumbered to make room for the new category. */
  updates: CategoryPositionUpdate[]
}

// The same rule as getPositionUpdates, for a new category inserted at `index`
// among `siblings`.
export const getInsertPositions = (
  siblings: CategoryTree[],
  index: number
): CategoryInsertPositions => {
  const freePosition = findFreePosition(
    siblings[index - 1]?.position,
    siblings[index]?.position
  )
  if (freePosition !== undefined) {
    return { position: freePosition, updates: [] }
  }
  return {
    position: index,
    updates: siblings
      .map((sibling, i) => ({
        id: sibling.id,
        position: i < index ? i : i + 1,
      }))
      .filter(({ position }, i) => siblings[i].position !== position),
  }
}

const findCategory = (
  categories: CategoryTree[],
  id: string
): CategoryTree | undefined => {
  for (const category of categories) {
    if (category.id === id) {
      return category
    }
    const found = findCategory(category.subcategories ?? [], id)
    if (found) {
      return found
    }
  }
  return undefined
}

// `/category-trees?categoryIds=` returns the whole root trees containing the
// ids; pick the requested categories as the roots, in the requested order.
export const pickCategorySubtrees = (
  trees: CategoryTree[],
  categoryIds: string[]
): CategoryTree[] =>
  categoryIds
    .map((id) => findCategory(trees, id))
    .filter((category): category is CategoryTree => !!category)
