import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  extractTotalCount,
  getBaseUrl,
  toApiError,
} from './base.api'

export type FetchProductsCountParams = {
  tenant: string
  token: string
  q?: string
}

export const fetchProductsCount = async ({
  tenant,
  token,
  q = '',
}: FetchProductsCountParams): Promise<number | null> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const url = `${baseUrl}/product/${encodeURIComponent(tenant)}/products/search`
  const body = q ? { q } : {}
  const params = new URLSearchParams({
    pageNumber: '1',
    pageSize: '1',
  })
  const res = await apiFetch(`${url}?${params}`, {
    method: 'POST',
    headers: buildHeaders({
      tenant,
      token,
      contentType: 'application/json',
      includeTotalCount: true,
    }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw toApiError(res, 'load products')
  }
  return extractTotalCount(res)
}
