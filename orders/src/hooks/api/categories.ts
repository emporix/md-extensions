import { useCallback } from 'react'
import { CategoryType, getCategoryTreesCall } from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useCategoriesApi = () => {
  const { tenant } = useDashboardContext()

  const getCategoryTrees = useCallback(async () => {
    if (!tenant) return Promise.reject(new Error('No tenant'))
    return getCategoryTreesCall(tenant, {
      showUnpublished: true,
      type: CategoryType.STANDARD,
    })
  }, [tenant])

  return { getCategoryTrees }
}
