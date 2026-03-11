import {
  apiFetch,
  buildHeaders,
  ensureApiContext,
  extractTotalCount,
  getBaseUrl,
  parseCollectionResponse,
  toApiError,
} from './base.api'

export type EmployeeApiResponse = {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  validFrom: string
  status: string
  isAccountLocked?: boolean
  lastLogin?: string
  [key: string]: unknown
}

export type FetchEmployeesParams = {
  tenant: string
  token: string
  pageNumber?: number
  pageSize?: number
}

export type FetchEmployeesResult = {
  employees: EmployeeApiResponse[]
  total: number | null
}

export const fetchEmployees = async ({
  tenant,
  token,
  pageNumber = 1,
  pageSize = 10,
}: FetchEmployeesParams): Promise<FetchEmployeesResult> => {
  const baseUrl = getBaseUrl()
  ensureApiContext(baseUrl, tenant, token)
  const params = new URLSearchParams({
    userType: 'EMPLOYEE',
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  const url = `${baseUrl}/iam/${encodeURIComponent(tenant)}/users?${params}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: buildHeaders({ tenant, token, includeTotalCount: true }),
  })
  if (!res.ok) {
    throw toApiError(res, 'load employees')
  }
  const data = await res.json()
  const employees = parseCollectionResponse<EmployeeApiResponse>(data)
  const total = extractTotalCount(res, data)
  return { employees, total: total ?? employees.length }
}
