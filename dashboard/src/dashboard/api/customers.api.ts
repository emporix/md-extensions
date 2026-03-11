import {
  apiFetch,
  buildHeaders,
  buildPaginationParams,
  buildRestrictionQuery,
  ensureApiContext,
  extractTotalCount,
  getBaseUrl,
  parseCollectionResponse,
  toApiError,
} from './base.api'

export type CustomerApiResponse = {
  id: string
  customerNumber: string
  firstName: string
  lastName: string
  company: string | null
  contactEmail: string
  active: boolean
  onHold?: boolean
  metadataCreatedAt: string
  lastLogin?: string
  [key: string]: unknown
}

export type FetchCustomersParams = {
  tenant: string
  token: string
  siteCode?: string
  pageNumber?: number
  pageSize?: number
}

export type FetchCustomersResult = {
  customers: CustomerApiResponse[]
  total: number | null
}

export const fetchCustomers = async ({
  tenant,
  token,
  siteCode,
  pageNumber = 1,
  pageSize = 10,
}: FetchCustomersParams): Promise<FetchCustomersResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({
    sort: 'metadataCreatedAt:DESC',
    pageNumber,
    pageSize,
  })
  if (siteCode) {
    params.set('q', buildRestrictionQuery(siteCode))
  }
  const url = `${baseUrl}/caas-customer/${encodeURIComponent(tenant)}/customers?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, includeTotalCount: true }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load customers')
  }
  const data = await res.json()
  const customers = parseCollectionResponse<CustomerApiResponse>(data)
  const hybrisCountRaw = res.headers.get('hybris-count')
  const totalFromHeader =
    hybrisCountRaw != null && hybrisCountRaw !== ''
      ? (() => {
          const parsed = parseInt(hybrisCountRaw, 10)
          return Number.isNaN(parsed) ? null : parsed
        })()
      : null
  const total = totalFromHeader ?? extractTotalCount(res, data)
  return { customers, total: total ?? customers.length }
}
