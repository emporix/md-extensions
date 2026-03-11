import {
  apiFetch,
  buildHeaders,
  buildPaginationParams,
  buildRestrictionQuery,
  ensureApiContext,
  getBaseUrl,
  parseCollectionResponse,
  toApiError,
} from './base.api'

export type QuoteCustomer = {
  customerId?: string
  firstName?: string
  lastName?: string
  contactEmail?: string
  [key: string]: unknown
}

export type QuoteCompany = {
  name?: string
  [key: string]: unknown
}

export type QuoteStatus = {
  value: string
  comment?: string
  [key: string]: unknown
}

export type QuoteTotalPrice = {
  currency?: string
  netValue?: number
  grossValue?: number
  taxValue?: number
  [key: string]: unknown
}

export type QuoteShippingAddress = {
  countryCode?: string
  [key: string]: unknown
}

export type QuoteMetadata = {
  createdAt?: string
  [key: string]: unknown
}

export type QuoteApiResponse = {
  id: string
  status: QuoteStatus
  siteCode?: string
  customer?: QuoteCustomer
  company?: QuoteCompany
  currency?: string
  restriction?: string
  shippingAddress?: QuoteShippingAddress
  totalPrice?: QuoteTotalPrice
  metadata?: QuoteMetadata
  businessModel?: string
  [key: string]: unknown
}

const DEFAULT_FIELDS =
  'id,customer,company,siteCode,currency,restriction,status,shippingAddress.countryCode,totalPrice,metadata.createdAt'

export type FetchQuotesParams = {
  tenant: string
  token: string
  sort?: string
  pageNumber?: number
  pageSize?: number
  q?: string
  fields?: string
}

export const fetchQuotes = async ({
  tenant,
  token,
  sort = 'metadata.createdAt:DESC',
  pageNumber = 1,
  pageSize = 50,
  q,
  fields = DEFAULT_FIELDS,
}: FetchQuotesParams): Promise<QuoteApiResponse[]> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({ sort, pageNumber, pageSize, fields })
  if (q) {
    params.set('q', q)
  }
  const url = `${baseUrl}/quote/${encodeURIComponent(tenant)}/quotes?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load quotes')
  }
  const data = await res.json()
  return parseCollectionResponse<QuoteApiResponse>(data)
}

export type FetchLastQuotesParams = {
  tenant: string
  token: string
  siteCode?: string
  pageSize?: number
}

export const fetchLastQuotes = async ({
  tenant,
  token,
  siteCode,
  pageSize = 50,
}: FetchLastQuotesParams): Promise<QuoteApiResponse[]> => {
  return fetchQuotes({
    tenant,
    token,
    sort: 'metadata.createdAt:DESC',
    pageNumber: 1,
    pageSize,
    q: siteCode ? buildRestrictionQuery(siteCode) : undefined,
  })
}
