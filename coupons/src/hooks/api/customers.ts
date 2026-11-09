import { useCallback } from 'react'
import { getCustomers, getCustomer } from '@emporix/api-calls'
import { PaginationProps, PaginatedResponse } from '../usePagination'
import { Customer } from '../../models/Customer.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

export const useCustomerApi = () => {
  const { tenant } = useDashboardContext()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  const syncCustomers = useCallback(
    (
      paginationParams: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Customer>> => {
      if (!canViewCustomers) {
        return Promise.reject(new Error('No permissions'))
      }
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return getCustomers(
        tenant,
        toApiPagination(paginationParams)
      ) as unknown as Promise<PaginatedResponse<Customer>>
    },
    [tenant, canViewCustomers]
  )

  const syncCustomer = useCallback(
    (customerId: string): Promise<Customer> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return getCustomer(tenant, customerId) as unknown as Promise<Customer>
    },
    [tenant]
  )

  const getAllCustomers = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<Customer[]> =>
      fetchAllRecords((p) => syncCustomers(p), {
        currentPage: 1,
        rows: 100,
        ...pagination,
      }),
    [syncCustomers]
  )

  return { syncCustomers, syncCustomer, getAllCustomers }
}
