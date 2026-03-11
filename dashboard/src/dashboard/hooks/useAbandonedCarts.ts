import { fetchAbandonedCarts } from '../api/carts.api'
import { getAbandonedCutoffIso } from '../helpers/cart.helpers'
import type { CartApiResponse } from '../api/carts.api'
import { useAsyncResource } from './useAsyncResource'

export type UseAbandonedCartsResult = {
  carts: CartApiResponse[]
  total: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useAbandonedCarts = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode?: string,
  pageSize = 10
): UseAbandonedCartsResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<{
    carts: CartApiResponse[]
    total: number | null
  }>({
    enabled: Boolean(tenant && token),
    initialValue: { carts: [], total: null },
    loadValue: async () => {
      const cutoffIso = getAbandonedCutoffIso()
      return fetchAbandonedCarts({
        tenant: tenantValue,
        token: tokenValue,
        siteCode,
        pageNumber: 1,
        pageSize,
        cutoffIso,
      })
    },
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token, siteCode, pageSize],
  })

  return {
    carts: value.carts,
    total: value.total,
    loading,
    error,
    refetch,
  }
}
