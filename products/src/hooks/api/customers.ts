import { useCallback } from 'react'
import { getCustomer, getCustomers } from '@emporix/api-calls'
import { PaginatedResponse, PaginationProps } from '../usePagination'
import { Customer } from '../../models/Customer.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean port of MD `hooks/api/customers` — only the calls the remote uses. */
export const useCustomerApi = () => {
  const { tenant } = useDashboardContext()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  const syncCustomers = useCallback(
    (
      paginationParams: Partial<PaginationProps>
    ): Promise<PaginatedResponse<Customer>> => {
      if (tenant && canViewCustomers) {
        return getCustomers(tenant, toApiPagination(paginationParams))
      } else if (!canViewCustomers) {
        return Promise.reject('no permissions')
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant, canViewCustomers]
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

  const syncCustomer = useCallback(
    (customerId: string): Promise<Customer> => {
      if (tenant) {
        return getCustomer(tenant, customerId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return { syncCustomers, getAllCustomers, syncCustomer }
}
