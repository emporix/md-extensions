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

export type ReturnMetadata = {
  createdAt?: string
  modifiedAt?: string
  version?: number
  [key: string]: unknown
}

export type ReturnRequestor = {
  customerId?: string
  firstName?: string
  lastName?: string
  email?: string
  [key: string]: unknown
}

export type ReturnApiResponse = {
  id: string
  approvalStatus: string
  metadata?: ReturnMetadata
  requestor?: ReturnRequestor
  received?: boolean
  expiryDate?: string
  orders?: Array<{
    id?: string
    total?: { value?: number; currency?: string }
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export type FetchReturnsParams = {
  tenant: string
  token: string
  sort?: string
  pageNumber?: number
  pageSize?: number
  q?: string
}

export type FetchReturnsResult = {
  returns: ReturnApiResponse[]
  total: number | null
}

export const fetchReturns = async ({
  tenant,
  token,
  sort = 'metadata.createdAt:DESC',
  pageNumber = 1,
  pageSize = 50,
  q = '',
}: FetchReturnsParams): Promise<FetchReturnsResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({ sort, pageNumber, pageSize })
  if (q) params.set('q', q)
  const url = `${baseUrl}/return/${encodeURIComponent(tenant)}/returns?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, includeTotalCount: true }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load returns')
  }
  const data = await res.json()
  const list = parseCollectionResponse<ReturnApiResponse>(data)
  const total = extractTotalCount(res, data)
  return {
    returns: list.filter((r) => r && typeof r.id === 'string'),
    total,
  }
}

export const fetchLastReturns = async (
  tenant: string,
  token: string,
  pageSize = 50
): Promise<ReturnApiResponse[]> => {
  const { returns } = await fetchReturns({
    tenant,
    token,
    sort: 'metadata.createdAt:DESC',
    pageNumber: 1,
    pageSize,
  })
  return returns
}
