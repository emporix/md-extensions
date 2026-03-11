import { fetchCouponsCount } from '../api/coupons.api'
import { useAsyncResource } from './useAsyncResource'

export type UseCouponsCountResult = {
  count: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useCouponsCount = (
  tenant: string | undefined,
  token: string | undefined
): UseCouponsCountResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<number | null>({
    enabled: Boolean(tenant && token),
    initialValue: null,
    loadValue: async () =>
      fetchCouponsCount({ tenant: tenantValue, token: tokenValue }),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return { count: value, loading, error, refetch }
}
