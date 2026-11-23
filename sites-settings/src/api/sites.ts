import { useCallback } from 'react'
import { fetchAll, listSitesCall } from '@emporix/api-calls/next'
import { useDashboardContext } from '../context/Dashboard.context'

/** The active sites of the host tenant, for `SitesProvider`. */
export const useSitesApi = () => {
  const { tenant } = useDashboardContext()

  const getSites = useCallback(() => {
    if (tenant) {
      return fetchAll(listSitesCall, {}, { tenant })
    }
    return Promise.reject(new Error('No tenant'))
  }, [tenant])

  return { getSites }
}
