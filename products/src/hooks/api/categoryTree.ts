import { useCallback } from 'react'
import {
  type CategoryTreesParams,
  getCategoryTreesCall,
} from '@emporix/api-calls'
import { CategoryTree } from '../../models/Category.model'
import { useDashboardContext } from '../../context/Dashboard.context'

/**
 * MD `useCategoryTreeApi`. Its rebuild and parents calls serve only category
 * editing, which the products module does not do, so they are not ported.
 */
export const useCategoryTreeApi = () => {
  const { tenant } = useDashboardContext()

  // The `type` filter needs the backend change from COP-6124. The responses
  // carry no type, and a backend without it ignores the param and returns
  // trees of both types, so it must reach an environment before this frontend.
  const getCategoryTrees = useCallback(
    (params?: CategoryTreesParams): Promise<CategoryTree[]> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      return getCategoryTreesCall(tenant, params)
    },
    [tenant]
  )

  return { getCategoryTrees }
}
