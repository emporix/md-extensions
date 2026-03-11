import type { EmployeeApiResponse } from '../api/employees.api'
import { fetchEmployees } from '../api/employees.api'
import { useAsyncResource } from './useAsyncResource'

export type UseEmployeesResult = {
  employees: EmployeeApiResponse[]
  total: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 10

export const useEmployees = (
  tenant: string | undefined,
  token: string | undefined
): UseEmployeesResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<{
    employees: EmployeeApiResponse[]
    total: number | null
  }>({
    enabled: Boolean(tenant && token),
    initialValue: { employees: [], total: null },
    loadValue: async () =>
      fetchEmployees({
        tenant: tenantValue,
        token: tokenValue,
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      }),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return {
    employees: value.employees,
    total: value.total,
    loading,
    error,
    refetch,
  }
}
