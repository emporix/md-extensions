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

export type CartPriceValue = {
  netValue?: number
  grossValue?: number
  taxValue?: number
  taxCode?: string
  taxRate?: number
  calculated?: string
}

export type CartCalculatedPrice = {
  price?: CartPriceValue
  shipping?: CartPriceValue
  totalShipping?: CartPriceValue
  finalPrice?: CartPriceValue
  [key: string]: unknown
}

export type CartApiResponse = {
  id: string
  customerId?: string
  currency?: string
  siteCode?: string
  calculatedPrice?: CartCalculatedPrice
  status?: string
  restriction?: string
  metadata?: {
    createdAt?: string
    modifiedAt?: string
    version?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type FetchCartsSearchParams = {
  tenant: string
  token: string
  q: string
  pageNumber?: number
  pageSize?: number
  sort?: string
  fields?: string
}

export type FetchCartsSearchResult = {
  carts: CartApiResponse[]
  total: number | null
}

const DEFAULT_FIELDS =
  'id,customerId,currency,siteCode,calculatedPrice,status,restriction,metadata'

export const fetchCartsSearch = async ({
  tenant,
  token,
  q,
  pageNumber = 1,
  pageSize = 10,
  sort = 'metadata.createdAt:DESC',
  fields = DEFAULT_FIELDS,
}: FetchCartsSearchParams): Promise<FetchCartsSearchResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({ pageNumber, pageSize, sort, fields })
  const url = `${baseUrl}/cart/${encodeURIComponent(tenant)}/carts/search?${params}`
  const res = await apiFetch(url, {
    method: 'POST',
    headers: buildHeaders({
      tenant,
      token,
      accept: 'application/json',
      contentType: 'application/json',
      includeTotalCount: true,
    }),
    body: JSON.stringify({ q }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load carts')
  }
  const data = await res.json()
  const list = parseCollectionResponse<CartApiResponse>(data)
  const total = extractTotalCount(res, data)
  return {
    carts: list.filter((c) => c && typeof c.id === 'string'),
    total,
  }
}

export type FetchCartsParams = {
  tenant: string
  token: string
  siteCode?: string
  status?: string
  pageNumber?: number
  pageSize?: number
}

export type FetchCartsResult = {
  carts: CartApiResponse[]
  total: number | null
}

const buildOpenCartsQuery = (
  siteCode: string | undefined,
  status: string
): string => {
  const parts: string[] = []
  if (siteCode) parts.push(`restriction:${siteCode}`)
  parts.push(`status:${status}`)
  return parts.join(' ')
}

export const fetchCarts = async ({
  tenant,
  token,
  siteCode,
  status = 'OPEN',
  pageNumber = 1,
  pageSize = 60,
}: FetchCartsParams): Promise<FetchCartsResult> => {
  const q = buildOpenCartsQuery(siteCode, status)
  return fetchCartsSearch({
    tenant,
    token,
    q,
    pageNumber,
    pageSize,
  })
}

export type FetchAbandonedCartsParams = {
  tenant: string
  token: string
  siteCode?: string
  pageNumber?: number
  pageSize?: number
  cutoffIso: string
}

const buildAbandonedCartsQuery = (
  siteCode: string | undefined,
  cutoffIso: string
): string => {
  const parts: string[] = []
  if (siteCode) parts.push(`restriction:${siteCode}`)
  parts.push(
    'status:OPEN',
    'customerId:exists',
    `metadataCreatedAt:<"${cutoffIso}"`
  )
  return parts.join(' ')
}

export const fetchAbandonedCarts = async ({
  tenant,
  token,
  siteCode,
  pageNumber = 1,
  pageSize = 10,
  cutoffIso,
}: FetchAbandonedCartsParams): Promise<FetchCartsSearchResult> => {
  const q = buildAbandonedCartsQuery(siteCode, cutoffIso)
  return fetchCartsSearch({
    tenant,
    token,
    q,
    pageNumber,
    pageSize,
  })
}
