import { useCallback } from 'react'
import { getSitesCall } from '@emporix/api-calls'
import { useDashboardContext } from '../context/Dashboard.context'

export const useSitesApi = () => {
  const { tenant } = useDashboardContext()

  const getSites = useCallback(() => {
    if (tenant) {
      return getSitesCall(tenant)
    }
    return Promise.reject('no tenant')
  }, [tenant])

  return { getSites }
}
