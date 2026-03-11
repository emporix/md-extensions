import type { QuoteApiResponse } from '../api/quotes.api'
import { fetchLastQuotes } from '../api/quotes.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseLastQuotesResult = {
  quotes: QuoteApiResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 50

export const useLastQuotes = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode: string | undefined
): UseLastQuotesResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const siteCodeValue = siteCode ?? ''

  const { value, loading, error, refetch } = useAsyncResource<
    QuoteApiResponse[]
  >({
    enabled: Boolean(tenant && token),
    initialValue: [],
    loadValue: () =>
      getOrLoad(`lastQuotes:${tenantValue}:${siteCodeValue}:${PAGE_SIZE}`, () =>
        fetchLastQuotes({
          tenant: tenantValue,
          token: tokenValue,
          siteCode: siteCodeValue,
          pageSize: PAGE_SIZE,
        })
      ),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token, siteCode],
  })

  return { quotes: value, loading, error, refetch }
}
