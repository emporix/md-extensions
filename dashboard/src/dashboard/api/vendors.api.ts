import {
  apiFetch,
  buildHeaders,
  buildPaginationParams,
  ensureApiContext,
  extractTotalCount,
  getBaseUrl,
  parseCollectionResponse,
  toApiError,
} from './base.api'

export type VendorApiResponse = {
  id: string
  name?: string
  type?: string
  metadata?: { createdAt?: string; modifiedAt?: string; [key: string]: unknown }
  [key: string]: unknown
}

export type FetchVendorsParams = {
  tenant: string
  token: string
  pageNumber?: number
  pageSize?: number
}

export type FetchVendorsResult = {
  vendors: VendorApiResponse[]
  total: number | null
}

export const fetchVendors = async ({
  tenant,
  token,
  pageNumber = 1,
  pageSize = 60,
}: FetchVendorsParams): Promise<FetchVendorsResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({ pageNumber, pageSize })
  const url = `${baseUrl}/vendor/${encodeURIComponent(tenant)}/vendors?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, includeTotalCount: true }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load vendors')
  }
  const data = await res.json()
  const list = parseCollectionResponse<VendorApiResponse>(data)
  const total = extractTotalCount(res, data)
  return {
    vendors: list.filter((v) => v && typeof v.id === 'string'),
    total,
  }
}
