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

export type SalesOrderCustomer = {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  [key: string]: unknown
}

export type SalesOrderShippingAddress = {
  country?: string
  [key: string]: unknown
}

export type SalesOrderFinalPrice = {
  netValue?: number
  grossValue?: number
  taxValue?: number
  [key: string]: unknown
}

export type SalesOrderCalculatedPrice = {
  totalPrice?: number
  finalPrice?: SalesOrderFinalPrice
  [key: string]: unknown
}

export type SalesOrderApiResponse = {
  id: string
  status: string
  siteCode?: string
  customer?: SalesOrderCustomer
  shippingAddress?: SalesOrderShippingAddress
  currency?: string
  created?: string
  calculatedPrice?: SalesOrderCalculatedPrice
  [key: string]: unknown
}

const DEFAULT_FIELDS =
  'id,status,customer,shippingAddress.country,calculatedPrice.finalPrice,created,currency'

export type FetchSalesOrdersParams = {
  tenant: string
  token: string
  sort?: string
  pageNumber?: number
  pageSize?: number
  q?: string
  fields?: string
}

export const fetchSalesOrders = async ({
  tenant,
  token,
  sort = 'created:DESC',
  pageNumber = 1,
  pageSize = 50,
  q,
  fields = DEFAULT_FIELDS,
}: FetchSalesOrdersParams): Promise<SalesOrderApiResponse[]> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = buildPaginationParams({ sort, pageNumber, pageSize, fields })
  if (q) {
    params.set('q', q)
  }
  const url = `${baseUrl}/order-v2/${encodeURIComponent(tenant)}/salesorders/?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load orders')
  }
  const data = await res.json()
  return parseCollectionResponse<SalesOrderApiResponse>(data)
}

const ORDERS_IN_PROGRESS_QUERY = (siteCode?: string): string =>
  siteCode
    ? `status:(SHIPPED OR CONFIRMED OR CREATED OR IN_CHECKOUT) ${buildRestrictionQuery(siteCode)}`
    : 'status:(SHIPPED OR CONFIRMED OR CREATED OR IN_CHECKOUT)'

export type FetchLastOrdersParams = {
  tenant: string
  token: string
  siteCode?: string
  pageSize?: number
}

export const fetchLastOrders = async ({
  tenant,
  token,
  siteCode,
  pageSize = 50,
}: FetchLastOrdersParams): Promise<SalesOrderApiResponse[]> => {
  return fetchSalesOrders({
    tenant,
    token,
    sort: 'created:DESC',
    pageNumber: 1,
    pageSize,
    q: siteCode ? buildRestrictionQuery(siteCode) : undefined,
  })
}

export type FetchOrdersInProgressParams = {
  tenant: string
  token: string
  siteCode?: string
  pageSize?: number
}

export const fetchOrdersInProgress = async ({
  tenant,
  token,
  siteCode,
  pageSize = 50,
}: FetchOrdersInProgressParams): Promise<SalesOrderApiResponse[]> => {
  return fetchSalesOrders({
    tenant,
    token,
    sort: 'created:DESC',
    pageNumber: 1,
    pageSize,
    q: ORDERS_IN_PROGRESS_QUERY(siteCode),
    fields:
      'id,status,siteCode,customer,shippingAddress.country,calculatedPrice.finalPrice,created,currency',
  })
}
