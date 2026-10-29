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

export const findAncestorKeys = (
  nodes: TreeNode[],
  key: string
): string[] | null => {
  for (const node of nodes) {
    if (String(node.key) === key) {
      return []
    }
    const path = findAncestorKeys(node.children ?? [], key)
    if (path) {
      return [String(node.key), ...path]
    }
  }
  return null
}
