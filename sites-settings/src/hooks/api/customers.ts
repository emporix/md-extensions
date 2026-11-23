import { useCallback } from 'react'
import {
  addCustomer,
  addCustomerAddress,
  fetchCustomerProfile,
  getAssistedBuyingLoginCall,
  getCustomer,
  getCustomers,
  patchCustomerAddress,
  patchCustomerCall,
  removeCustomer,
  removeCustomerAddress,
  updateCustomer,
  updateCustomerAddress,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import {
  Customer,
  CustomerAddress,
  CustomerBusinessModel,
} from '../../models/Customer.model'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { EmployeeDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

export const useCustomerApi = () => {
  const { tenant } = useDashboardContext()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  const syncCustomers = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      businessModel?: CustomerBusinessModel
    ) => {
      if (tenant && canViewCustomers) {
        return getCustomers(
          tenant,
          toApiPagination(paginationParams),
          businessModel
        )
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
    (customerId: string) => {
      if (tenant) {
        return getCustomer(tenant, customerId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const editCustomer = useCallback(
    (customer: Customer) => {
      if (tenant && customer.id) {
        return updateCustomer(tenant, customer.id, customer)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const patchCustomer = useCallback(
    (customer: Partial<Customer>) => {
      if (tenant && customer.id) {
        return patchCustomerCall(tenant, customer.id, customer)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const createCustomer = useCallback(
    (customer: Customer): Promise<{ id: string; link: string }> => {
      if (tenant) {
        return addCustomer(tenant, customer)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const deleteCustomer = useCallback(
    (customerId: string) => {
      if (tenant) {
        return removeCustomer(tenant, customerId)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const createCustomerAddress = useCallback(
    (customerId: string, address: CustomerAddress) => {
      if (tenant) {
        return addCustomerAddress(tenant, customerId, address)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const editCustomerAddress = useCallback(
    (customerId: string, address: CustomerAddress) => {
      if (!address.id) {
        return Promise.reject('no address id')
      }
      if (tenant) {
        return updateCustomerAddress(tenant, customerId, address.id, address)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const partiallyEditCustomerAddress = useCallback(
    (customerId: string, address: Partial<CustomerAddress>) => {
      if (!address.id) {
        return Promise.reject('no address id')
      }
      if (tenant) {
        return patchCustomerAddress(tenant, customerId, address.id, address)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const deleteCustomerAddress = useCallback(
    (customerId: string, addressId: string) => {
      if (tenant) {
        return removeCustomerAddress(tenant, customerId, addressId)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const getCustomerProfile = useCallback(
    (customerId: string) => {
      if (tenant) {
        return fetchCustomerProfile(tenant, customerId)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  const getAssistedBuyingLogin = useCallback(
    (customerId: string) => {
      if (tenant) {
        return getAssistedBuyingLoginCall(tenant, customerId)
      } else {
        return Promise.reject('no data')
      }
    },
    [tenant]
  )

  return {
    syncCustomers,
    getAllCustomers,
    syncCustomer,
    editCustomer,
    patchCustomer,
    createCustomer,
    deleteCustomer,
    createCustomerAddress,
    editCustomerAddress,
    partiallyEditCustomerAddress,
    deleteCustomerAddress,
    getCustomerProfile,
    getAssistedBuyingLogin,
  }
}
