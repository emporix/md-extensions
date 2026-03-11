import type { DashboardSite } from '../models/DashboardContext.types'
import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  getBaseUrl,
  parseCollectionResponse,
  toApiError,
} from './base.api'

export type SiteApiResponse = {
  code: string
  name: string
  active: boolean
  defaultLanguage: string
  languages: string[]
  currency: string
  availableCurrencies?: string[]
}

export const fetchSites = async (
  tenant: string,
  token: string
): Promise<DashboardSite[]> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const url = `${baseUrl}/site/${encodeURIComponent(tenant)}/sites`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load sites')
  }
  const data = await res.json()
  return parseCollectionResponse<SiteApiResponse>(data)
}
