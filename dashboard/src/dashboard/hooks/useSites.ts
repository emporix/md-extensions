import type { DashboardSite } from '../models/DashboardContext.types'
import { fetchSites } from '../api/sites.api'
import { useAsyncResource } from './useAsyncResource'

export type UseSitesResult = {
  sites: DashboardSite[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useSites = (
  tenant: string | undefined,
  token: string | undefined
): UseSitesResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const { value, loading, error, refetch } = useAsyncResource<DashboardSite[]>({
    enabled: Boolean(tenant && token),
    initialValue: [],
    loadValue: async () => fetchSites(tenantValue, tokenValue),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return { sites: value, loading, error, refetch }
}
