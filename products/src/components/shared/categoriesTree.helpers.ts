import type { TreeNode } from '@emporix/component-library'

export const findFirstCategory = (node: TreeNode): string | null => {
  if (node.leaf !== false) {
    return node.key ? node.key.toString() : null
  }
  return (
    node?.children
      ?.map((child) => {
        const key = findFirstCategory(child)
        if (key) {
          return key
        }
        return null
      })
      .filter((key): key is string => !!key)?.[0] || null
  )
}

export const replaceInTree = (
  nodes: TreeNode[] | undefined,
  lazyNode: TreeNode
): boolean => {
  return (
    Array.isArray(nodes) &&
    nodes.some((node: TreeNode, idx: number, arr: TreeNode[]) => {
      if (node.key === lazyNode.key) {
        arr[idx] = lazyNode
        return true
      }
      return replaceInTree(node.children, lazyNode)
    })
  )
}
