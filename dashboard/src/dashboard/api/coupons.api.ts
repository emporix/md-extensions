import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  extractTotalCount,
  getBaseUrl,
  toApiError,
} from './base.api'

export type FetchCouponsCountParams = {
  tenant: string
  token: string
}

export const fetchCouponsCount = async ({
  tenant,
  token,
}: FetchCouponsCountParams): Promise<number | null> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = new URLSearchParams({
    pageNumber: '1',
    pageSize: '1',
  })
  const url = `${baseUrl}/coupon/${encodeURIComponent(tenant)}/coupons?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, includeTotalCount: true }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load coupons')
  }
  return extractTotalCount(res)
}
