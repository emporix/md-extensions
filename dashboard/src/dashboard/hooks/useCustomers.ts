import type { CustomerApiResponse } from '../api/customers.api'
import { fetchCustomers } from '../api/customers.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseCustomersResult = {
  customers: CustomerApiResponse[]
  total: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 10

export const useCustomers = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode: string | undefined
): UseCustomersResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const siteCodeValue = siteCode ?? ''

  const { value, loading, error, refetch } = useAsyncResource<{
    customers: CustomerApiResponse[]
    total: number | null
  }>({
    enabled: Boolean(tenant && token),
    initialValue: { customers: [], total: null },
    loadValue: () =>
      getOrLoad(
        `customers:${tenantValue}:${siteCodeValue}:1:${PAGE_SIZE}`,
        () =>
          fetchCustomers({
            tenant: tenantValue,
            token: tokenValue,
            siteCode: siteCodeValue,
            pageNumber: 1,
            pageSize: PAGE_SIZE,
          })
      ),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token, siteCode],
  })

  return {
    customers: value.customers,
    total: value.total,
    loading,
    error,
    refetch,
  }
}
