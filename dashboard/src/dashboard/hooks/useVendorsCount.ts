import { fetchVendors } from '../api/vendors.api'
import { useAsyncResource } from './useAsyncResource'

export type UseVendorsCountResult = {
  count: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useVendorsCount = (
  tenant: string | undefined,
  token: string | undefined
): UseVendorsCountResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<number | null>({
    enabled: Boolean(tenant && token),
    initialValue: null,
    loadValue: async () => {
      const { total } = await fetchVendors({
        tenant: tenantValue,
        token: tokenValue,
        pageNumber: 1,
        pageSize: 1,
      })
      return total
    },
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return { count: value, loading, error, refetch }
}
