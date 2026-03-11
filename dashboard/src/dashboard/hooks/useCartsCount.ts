import { fetchCarts } from '../api/carts.api'
import { useAsyncResource } from './useAsyncResource'

export type UseCartsCountResult = {
  count: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useCartsCount = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode?: string,
  status?: string
): UseCartsCountResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<number | null>({
    enabled: Boolean(tenant && token),
    initialValue: null,
    loadValue: async () => {
      const { total } = await fetchCarts({
        tenant: tenantValue,
        token: tokenValue,
        siteCode,
        status,
        pageNumber: 1,
        pageSize: 1,
      })
      return total
    },
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token, siteCode, status],
  })

  return { count: value, loading, error, refetch }
}
