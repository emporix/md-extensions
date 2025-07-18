import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, StatisticsFilters, UserTenantsResponse } from './models/Statistics.model'

export const callApi = async <T, R = undefined>(
  path: string,
  method: string,
  tenant: string,
  token: string,
  data?: R
) => {
  const response = fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'emporix-tenant': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  return (await response).json() as Promise<T>
}

export const fetchAllTenants = async (tenant: string, token: string) => {
  const response = await callApi<{ tenants: string[] }>(
    `/statistics/emporix/allTenants`,
    'GET',
    tenant,
    token
  )
  return response
}

export const fetchUserTenants = async (tenant: string, token: string) => {
  const response = await callApi<UserTenantsResponse>(
    `/auth-adapter/users/me/tenants`,
    'GET',
    tenant,
    token
  )
  return response
}

export const fetchStatistics = async (
  authTenant: string,
  dataTenant: string,
  token: string,
  filters: StatisticsFilters
) => {
  const { timeUnit, startTime, endTime } = filters
  const params = new URLSearchParams({
    timeunit: timeUnit,
    startTime,
    endTime,
  })
  
  // Special tenants use authTenant for header, others use dataTenant
  const specialTenants = ['emporix', 'emporixstage', 'emporixdev']
  const headerTenant = specialTenants.includes(authTenant) ? authTenant : dataTenant
  
  const statistics = await callApi<ApiCallsStatisticsResponse>(
    `/statistics/tenants/${dataTenant}/usage/apicalls?${params.toString()}`,
    'GET',
    headerTenant,
    token
  )
  return statistics
}

export const fetchMakeStatistics = async (
  authTenant: string,
  dataTenant: string,
  token: string,
  filters: StatisticsFilters
) => {
  const { timeUnit, startTime, endTime } = filters
  const params = new URLSearchParams({
    timeunit: timeUnit,
    startTime,
    endTime,
  })
  
  // Special tenants use authTenant for header, others use dataTenant
  const specialTenants = ['emporix', 'emporixstage', 'emporixdev']
  const headerTenant = specialTenants.includes(authTenant) ? authTenant : dataTenant
  
  const statistics = await callApi<MakeStatisticsResponse>(
    `/statistics/${dataTenant}/usages/make?${params.toString()}`,
    'GET',
    headerTenant,
    token
  )
  return statistics
}

export const fetchDatabaseStatistics = async (
  authTenant: string,
  dataTenant: string,
  token: string,
  filters: StatisticsFilters
) => {
  const { timeUnit, startTime, endTime } = filters
  const params = new URLSearchParams({
    timeunit: timeUnit,
    startTime,
    endTime,
  })
  
  // Special tenants use authTenant for header, others use dataTenant
  const specialTenants = ['emporix', 'emporixstage', 'emporixdev']
  const headerTenant = specialTenants.includes(authTenant) ? authTenant : dataTenant
  
  const statistics = await callApi<DatabaseStatisticsResponse>(
    `/statistics/${dataTenant}/usages/mongodbStorage?${params.toString()}`,
    'GET',
    headerTenant,
    token
  )
  return statistics
}

export const fetchCloudinaryStatistics = async (
  authTenant: string,
  dataTenant: string,
  token: string,
  filters: StatisticsFilters
) => {
  const { timeUnit, startTime, endTime } = filters
  const params = new URLSearchParams({
    timeunit: timeUnit,
    startTime,
    endTime,
  })
  
  // Special tenants use authTenant for header, others use dataTenant
  const specialTenants = ['emporix', 'emporixstage', 'emporixdev']
  const headerTenant = specialTenants.includes(authTenant) ? authTenant : dataTenant
  
  const statistics = await callApi<CloudinaryStatisticsResponse>(
    `/statistics/${dataTenant}/usages/cloudinary?${params.toString()}`,
    'GET',
    headerTenant,
    token
  )
  return statistics
}
