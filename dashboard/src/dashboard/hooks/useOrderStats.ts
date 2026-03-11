import type { OrderStatsResponse } from '../api/orderStats.api'
import { fetchOrderStats } from '../api/orderStats.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseOrderStatsResult = {
  data: OrderStatsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useOrderStats = (
  tenant: string | undefined,
  token: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  currency?: string,
  siteCode?: string
): UseOrderStatsResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const startValue = startTime ?? ''
  const endValue = endTime ?? ''
  const currencyValue = currency ?? ''
  const siteCodeValue = siteCode ?? ''

  const cacheKey = `orderStats:${tenantValue}:${startValue}:${endValue}:${currencyValue}:${siteCodeValue}`
  const { value, loading, error, refetch } =
    useAsyncResource<OrderStatsResponse | null>({
      enabled: Boolean(tenant && token && startTime && endTime),
      initialValue: null,
      loadValue: () =>
        getOrLoad(cacheKey, () =>
          fetchOrderStats({
            tenant: tenantValue,
            token: tokenValue,
            startTime: startValue,
            endTime: endValue,
            currency: currencyValue,
            restriction: siteCodeValue || undefined,
          })
        ),
      errorMessage: 'errors.failedToLoadData',
      deps: [tenant, token, startTime, endTime, currency, siteCode],
    })

  return { data: value, loading, error, refetch }
}
