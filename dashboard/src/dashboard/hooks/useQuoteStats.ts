import type { QuoteStatsResponse } from '../api/quoteStats.api'
import { fetchQuoteStats } from '../api/quoteStats.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseQuoteStatsResult = {
  data: QuoteStatsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useQuoteStats = (
  tenant: string | undefined,
  token: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  currency?: string,
  siteCode?: string
): UseQuoteStatsResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const startValue = startTime ?? ''
  const endValue = endTime ?? ''
  const currencyValue = currency ?? ''
  const siteCodeValue = siteCode ?? ''

  const cacheKey = `quoteStats:${tenantValue}:${startValue}:${endValue}:${currencyValue}:${siteCodeValue}`
  const { value, loading, error, refetch } =
    useAsyncResource<QuoteStatsResponse | null>({
      enabled: Boolean(tenant && token && startTime && endTime),
      initialValue: null,
      loadValue: () =>
        getOrLoad(cacheKey, () =>
          fetchQuoteStats({
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
