import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  getBaseUrl,
  normalizeISOEnd,
  normalizeISOStart,
  toApiError,
} from './base.api'

export type QuoteStatsStatuses = {
  ACCEPTED?: number
  AWAITING?: number
  CREATING?: number
  DECLINED?: number
  DECLINED_BY_MERCHANT?: number
  EXPIRED?: number
  IN_PROGRESS?: number
  OPEN?: number
}

export type QuoteStatsGroupedTotal = {
  groupedBy: {
    currencyISOCode: string
    timestamp: string
  }
  statuses: QuoteStatsStatuses
  gov: number
  totalQuotes: number
  netgov: number
  govGrowth?: number
  totalQuotesGrowth?: number
}

export type QuoteStatsTotalsEntry = {
  gov: number
  fees?: number
  netgov: number
  totalQuotes: number
  quotesPerHour?: number
  currencyISOCode?: string
  govGrowth?: number
  totalQuotesGrowth?: number
  statuses: QuoteStatsStatuses
  [key: string]: unknown
}

export type QuoteStatsResponse = {
  values: {
    groupedTotals: QuoteStatsGroupedTotal[]
    totals?: QuoteStatsTotalsEntry[]
    groupBy: string
    startTime: string
    endTime: string
    [key: string]: unknown
  }
  chart?: {
    data?: { labels: string[]; values: number[] }
    series?: Array<{ labels: string[]; values: number[] }>
    [key: string]: unknown
  }
}

export type FetchQuoteStatsParams = {
  tenant: string
  token: string
  startTime: string
  endTime: string
  currency?: string
  restriction?: string
}

export const fetchQuoteStats = async ({
  tenant,
  token,
  startTime,
  endTime,
  currency,
  restriction,
}: FetchQuoteStatsParams): Promise<QuoteStatsResponse> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = new URLSearchParams({
    startTime: normalizeISOStart(startTime),
    endTime: normalizeISOEnd(endTime),
    compare: 'true',
  })
  if (currency) {
    params.set('currency', currency)
  }
  if (restriction) {
    params.set('restriction', restriction)
  }
  const url = `${baseUrl}/statistics/tenants/${encodeURIComponent(tenant)}/quoteStats?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load quote stats')
  }
  return (await res.json()) as QuoteStatsResponse
}
