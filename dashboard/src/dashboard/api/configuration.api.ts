/**
 * Configuration Service API (tenant configurations).
 * @see https://developer.emporix.io/api-references-1/readme/api-reference-8/tenant-configurations
 */
import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  getBaseUrl,
  toApiError,
} from './base.api'

export type TenantConfiguration = {
  key: string
  value: unknown
  version?: number
  description?: string
  secured?: boolean
  restricted?: boolean
  readOnly?: boolean
  schemaUrl?: string
}

export type FetchConfigurationParams = {
  tenant: string
  token: string
  propertyKey: string
}

export type FetchConfigurationResult =
  | { config: TenantConfiguration }
  | { notFound: true }

export type FetchBasicConfigurationParams = {
  tenant: string
  token: string
}

export const fetchBasicConfiguration = async ({
  tenant,
  token,
}: FetchBasicConfigurationParams): Promise<TenantConfiguration[]> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const url = `${baseUrl}/configuration/${encodeURIComponent(tenant)}/basic-configuration`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, accept: 'application/json' }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load basic configuration')
  }
  return (await res.json()) as TenantConfiguration[]
}

export const fetchConfiguration = async ({
  tenant,
  token,
  propertyKey,
}: FetchConfigurationParams): Promise<FetchConfigurationResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  if (!propertyKey) {
    throw new Error('Missing configuration property key')
  }
  const url = `${baseUrl}/configuration/${encodeURIComponent(tenant)}/configurations/${encodeURIComponent(propertyKey)}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, accept: 'application/json' }),
  })
  if (res.status === 404) return { notFound: true }
  if (!res.ok) {
    throw toApiError(res, 'load configuration')
  }
  const config = (await res.json()) as TenantConfiguration
  return { config }
}

export type CreateConfigurationsParams = {
  tenant: string
  token: string
  configurations: TenantConfiguration[]
}

export class ConfigurationConflictError extends Error {
  constructor() {
    super('Configuration already exists')
    this.name = 'ConfigurationConflictError'
  }
}

export const createConfigurations = async ({
  tenant,
  token,
  configurations,
}: CreateConfigurationsParams): Promise<TenantConfiguration[]> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const url = `${baseUrl}/configuration/${encodeURIComponent(tenant)}/configurations`
  const res = await apiFetch(url, {
    method: 'POST',
    headers: buildHeaders({
      tenant,
      token,
      accept: 'application/json',
      contentType: 'application/json',
    }),
    body: JSON.stringify(configurations),
  })
  if (res.status === 409) {
    throw new ConfigurationConflictError()
  }
  if (!res.ok) {
    throw toApiError(res, 'create configuration')
  }
  return (await res.json()) as TenantConfiguration[]
}

export type UpdateConfigurationParams = {
  tenant: string
  token: string
  propertyKey: string
  configuration: TenantConfiguration
}

export const updateConfiguration = async ({
  tenant,
  token,
  propertyKey,
  configuration,
}: UpdateConfigurationParams): Promise<TenantConfiguration> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const url = `${baseUrl}/configuration/${encodeURIComponent(tenant)}/configurations/${encodeURIComponent(propertyKey)}`
  const res = await apiFetch(url, {
    method: 'PUT',
    headers: buildHeaders({
      tenant,
      token,
      accept: 'application/json',
      contentType: 'application/json',
    }),
    body: JSON.stringify(configuration),
  })
  if (!res.ok) {
    throw toApiError(res, 'update configuration')
  }
  return (await res.json()) as TenantConfiguration
}
