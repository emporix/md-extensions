import { useCallback } from 'react'
import { api } from '.'
import {
  formatFilterQueryV2 as formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { PaginationProps } from '../hooks/usePagination'
import {
  Customer,
  CustomerAddress,
  CustomerBusinessModel,
} from '../models/Customer'
import { PaginatedResponse } from './orders'
import { usePermissions } from '../context/PermissionsProvider'
import { useTenant } from '../context/TenantProvider'

const getCustomers = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  businessModel?: CustomerBusinessModel
): Promise<PaginatedResponse<Customer>> => {
  const params = {
    sort: formatPaginationParamsForSorting(pagination),
    ...formatPaginationParamsForEmporixPagination(pagination),
    q:
      formatFilterQuery(pagination.filters) +
      (pagination.filters ? ' ' : '') +
      'type:("CUSTOMER" OR missing)',
    expand: 'mixin:*',
  }
  if (businessModel) {
    params.q += `; businessModel:${businessModel}`
  }
  const { data, headers } = await api.get<Customer[]>(
    `caas-customer/${tenant}/customers`,
    {
      headers: { 'X-Version': 'v2' },
      params,
    }
  )
  return { values: data, totalRecords: +headers['hybris-count'] }
}

const getCustomer = async (tenant: string, id: string) => {
  const options = {
    expand: 'addresses,mixin:*',
  }
  const { data } = await api.get<Customer>(
    `caas-customer/${tenant}/customers/${id}?${new URLSearchParams(options)}`,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const addCustomer = async (
  tenant: string,
  customer: Customer
): Promise<{ id: string; link: string }> => {
  const { data } = await api.post<{ id: string; link: string }>(
    `caas-customer/${tenant}/customers`,
    customer,
    {
      params: {
        sendPasswordResetNotifications: customer?.type !== 'CONTACT',
      },
      headers: {
        'X-Version': 'v2',
        // remove after backend fixes
        'hybris-session-id': 'mock_session_id',
      },
    }
  )
  return data
}

const updateCustomer = async (
  tenant: string,
  customerId: string,
  customer: Customer
) => {
  const { data } = await api.patch(
    `caas-customer/${tenant}/customers/${customerId}`,
    customer,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const patchCustomerCall = async (
  tenant: string,
  customerId: string,
  customer: Partial<Customer>
) => {
  const { data } = await api.patch(
    `caas-customer/${tenant}/customers/${customerId}`,
    customer,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const updateCustomerAddress = async (
  tenant: string,
  customerId: string,
  addressId: string,
  address: CustomerAddress
) => {
  const { data } = await api.patch(
    `caas-customer/${tenant}/customers/${customerId}/addresses/${addressId}`,
    address,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const patchCustomerAddress = async (
  tenant: string,
  customerId: string,
  addressId: string,
  address: Partial<CustomerAddress>
) => {
  const { data } = await api.patch(
    `caas-customer/${tenant}/customers/${customerId}/addresses/${addressId}`,
    address,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const addCustomerAddress = async (
  tenant: string,
  customerId: string,
  address: CustomerAddress
) => {
  const { data } = await api.post(
    `caas-customer/${tenant}/customers/${customerId}/addresses`,
    address,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const removeCustomerAddress = async (
  tenant: string,
  customerId: string,
  addressId: string
) => {
  await api.delete(
    `caas-customer/${tenant}/customers/${customerId}/addresses/${addressId}`,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
}

const removeCustomer = async (tenant: string, customerId: string) => {
  const { data } = await api.delete<void>(
    `caas-customer/${tenant}/customers/${customerId}`,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const fetchCustomerProfile = async (tenant: string, customerId: string) => {
  const { data } = await api.get<any>(
    `customer/${tenant}/customers/${customerId}`,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data
}

const getAssistedBuyingLoginCall = async (
  tenant: string,
  customerId: string
) => {
  const { data } = await api.post(`customer/${tenant}/assisted-buying-login`, {
    customerNumber: customerId,
  })
  return data
}

export const useCustomerApi = () => {
  const { tenant } = useTenant()
  const { permissions } = usePermissions()
  const canViewCustomers = permissions?.customers?.viewer

  const syncCustomers = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      businessModel?: CustomerBusinessModel
    ) => {
      if (tenant && canViewCustomers) {
        return getCustomers(tenant, paginationParams, businessModel)
      } else if (!canViewCustomers) {
        return Promise.reject('no permissions')
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant, permissions]
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
