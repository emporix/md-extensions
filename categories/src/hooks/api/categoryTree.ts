import { useCallback } from 'react'
import {
  type CategoryTreesParams,
  getCategoryParentsCall,
  getCategoryTreesCall,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import { CategoryTree } from '../../models/Category.model'
import { useDashboardContext } from '../../context/Dashboard.context'

const NO_TENANT = 'No tenant provided'

/** Ported from management-dashboard `hooks/api/categoryTree.ts`. */
export const useCategoryTreeApi = () => {
  const { tenant } = useDashboardContext()

  // The `type` filter needs the backend change from COP-6124. The responses
  // carry no type, and a backend without it ignores the param and returns
  // trees of both types, so it must reach an environment before this frontend.
  const getCategoryTrees = useCallback(
    (params?: CategoryTreesParams): Promise<CategoryTree[]> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return getCategoryTreesCall(tenant, params) as Promise<CategoryTree[]>
    },
    [tenant]
  )

  const rebuildCategoryTree = useCallback(
    (rootCategoryId: string): Promise<CategoryTree> => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return rebuildCategoryTreeCall(
        tenant,
        rootCategoryId
      ) as Promise<CategoryTree>
    },
    [tenant]
  )

  // Unpublished ancestors too, so the root of any category can be resolved.
  const getCategoryParents = useCallback(
    (categoryId: string) => {
      if (!tenant) return Promise.reject(NO_TENANT)
      return getCategoryParentsCall(tenant, categoryId, true)
    },
    [tenant]
  )

  return { getCategoryTrees, rebuildCategoryTree, getCategoryParents }
}
