import type { TreeNode } from '@emporix/component-library'
import { CategoryTree } from '../../models/Category.model'
import {
  findNodeLocation,
  findRootKeyContaining,
  getPositionUpdates,
} from './categoriesTree.helpers'

/** A partial update moves a category to the top level with this parent. */
export const ROOT_PARENT_ID = 'root'

export interface CategoryPlacement {
  parentId?: string
  position?: number
}

const parentIdOf = (parent: TreeNode | null) =>
  parent ? String((parent.data as CategoryTree).id) : ROOT_PARENT_ID

/**
 * What a drop has to save, ported from MD `CategoryTreeBase.handleDragDrop`:
 * the moved category gets a free position among its new siblings (or the
 * siblings are renumbered when there is no gap), and a new parent when it was
 * dropped onto another category or between categories of another parent.
 * Null when the moved category is not in the new tree.
 */
export const getCategoryMovePlacements = (
  previous: TreeNode[],
  next: TreeNode[],
  dragKey: string
): Map<string, CategoryPlacement> | null => {
  const dragLocation = findNodeLocation(next, dragKey)
  if (!dragLocation) return null

  const newParentId = parentIdOf(dragLocation.parent)
  const oldLocation = findNodeLocation(previous, dragKey)
  const oldParentId = parentIdOf(oldLocation?.parent ?? null)

  const placements = new Map<string, CategoryPlacement>(
    getPositionUpdates(
      dragLocation.siblings.map((sibling) => sibling.data as CategoryTree),
      dragKey
    ).map(({ id, position }) => [id, { position }])
  )
  if (newParentId !== oldParentId) {
    placements.set(dragKey, {
      ...placements.get(dragKey),
      parentId: newParentId,
    })
  }
  return placements
}

/**
 * The roots to rebuild after the placements of `changedIds` were sent. Renumbered top-level
 * categories are roots of their own trees, a failed change kept its old place,
 * and the old root of the moved category is rebuilt as long as it still
 * exists.
 */
export const getCategoryMoveRootKeys = (
  previous: TreeNode[],
  next: TreeNode[],
  dragKey: string,
  changedIds: string[],
  failedIds: Set<string>
): (string | null)[] => {
  const rootKeys = changedIds.map((id) =>
    findRootKeyContaining(failedIds.has(id) ? previous : next, id)
  )
  const oldRootKey = findRootKeyContaining(previous, dragKey)
  if (failedIds.has(dragKey)) {
    // The root it was dropped into does not hold it after all.
    rootKeys.push(findRootKeyContaining(next, dragKey))
  } else if (next.some((root) => String(root.key) === oldRootKey)) {
    rootKeys.push(oldRootKey)
  }
  return rootKeys
}
