import { useCallback } from 'react'
import { CategoryTree } from '../../models/Category.model'
import { useCategoryTreeApi } from './categoryTree'

const isNotFound = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404

/**
 * Centralised category-tree rebuild orchestration (ported from
 * management-dashboard `hooks/api/categoryTreeRebuild.ts`).
 *
 * The `/category-trees` structure is materialised/cached per ROOT category, so
 * after any category mutation (create / edit / delete / move) the affected
 * root tree(s) must be rebuilt. Rebuild only accepts a root category id, so a
 * cross-root move requires rebuilding both the source and destination roots.
 */
export const useCategoryTreeRebuild = () => {
  const { rebuildCategoryTree, getCategoryParents } = useCategoryTreeApi()

  /** Resolves the top-level root id for each category (parents come root→leaf). */
  const resolveRoots = useCallback(
    async (categoryIds: string[]): Promise<string[]> => {
      const uniqueIds = [...new Set(categoryIds.filter(Boolean))]
      const roots = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const parents = await getCategoryParents(id)
            return parents[0]?.id ?? id
          } catch (e: unknown) {
            // The parents endpoint answers 404 for a root category.
            if (isNotFound(e)) {
              return id
            }
            throw e
          }
        })
      )
      return [...new Set(roots)]
    },
    [getCategoryParents]
  )

  /** Rebuilds the given roots, ignoring roots that no longer exist (404). */
  const rebuildRoots = useCallback(
    async (rootIds: (string | null | undefined)[]): Promise<CategoryTree[]> => {
      const uniqueRoots = [
        ...new Set(rootIds.filter((root): root is string => !!root)),
      ]
      const results = await Promise.all(
        uniqueRoots.map(async (rootId) => {
          try {
            return await rebuildCategoryTree(rootId)
          } catch (e: unknown) {
            // A root deleted in the meantime has no tree left to rebuild.
            if (isNotFound(e)) {
              return null
            }
            throw e
          }
        })
      )
      return results.filter((tree): tree is CategoryTree => !!tree)
    },
    [rebuildCategoryTree]
  )

  /** Resolves roots for the given categories, then rebuilds them. */
  const rebuildForCategories = useCallback(
    async (categoryIds: string[]): Promise<void> => {
      const roots = await resolveRoots(categoryIds)
      await rebuildRoots(roots)
    },
    [resolveRoots, rebuildRoots]
  )

  return { resolveRoots, rebuildRoots, rebuildForCategories }
}
