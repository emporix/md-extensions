import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  getBaseUrl,
  normalizeISOEnd,
  normalizeISOStart,
  toApiError,
} from './base.api'

export type OrderStatsGroupedTotal = {
  groupedBy: {
    currencyISOCode: string
    timestamp: string
  }
  gov: number
  totalOrders: number
  fees: number
  netgov: number
  govGrowth?: number
  totalOrdersGrowth?: number
}

export type OrderStatsTotalsEntry = {
  gov: number
  totalOrders: number
  govGrowth?: number
  totalOrdersGrowth?: number
  currencyISOCode?: string
  [key: string]: unknown
}

export type OrderStatsResponse = {
  values: {
    groupedTotals: OrderStatsGroupedTotal[]
    totals?: OrderStatsTotalsEntry[]
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

export type FetchOrderStatsParams = {
  tenant: string
  token: string
  startTime: string
  endTime: string
  currency?: string
  /** When set, sent as `restriction` query param (e.g. selected site code) */
  restriction?: string
}

export const fetchOrderStats = async ({
  tenant,
  token,
  startTime,
  endTime,
  currency,
  restriction,
}: FetchOrderStatsParams): Promise<OrderStatsResponse> => {
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
  const url = `${baseUrl}/statistics/tenants/${encodeURIComponent(tenant)}/orderStats?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load order stats')
  }
  return (await res.json()) as OrderStatsResponse
}
