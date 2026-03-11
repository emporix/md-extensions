import { fetchProductsCount } from '../api/products.api'
import { useAsyncResource } from './useAsyncResource'

export type UseProductsCountResult = {
  count: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useProductsCount = (
  tenant: string | undefined,
  token: string | undefined
): UseProductsCountResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<number | null>({
    enabled: Boolean(tenant && token),
    initialValue: null,
    loadValue: async () =>
      fetchProductsCount({ tenant: tenantValue, token: tokenValue }),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return { count: value, loading, error, refetch }
}
