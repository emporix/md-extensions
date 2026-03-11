import type { SalesOrderApiResponse } from '../api/orders.api'
import { fetchLastOrders } from '../api/orders.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseLastOrdersResult = {
  orders: SalesOrderApiResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 50

export const useLastOrders = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode: string | undefined
): UseLastOrdersResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const siteCodeValue = siteCode ?? ''

  const { value, loading, error, refetch } = useAsyncResource<
    SalesOrderApiResponse[]
  >({
    enabled: Boolean(tenant && token),
    initialValue: [],
    loadValue: () =>
      getOrLoad(`lastOrders:${tenantValue}:${siteCodeValue}:${PAGE_SIZE}`, () =>
        fetchLastOrders({
          tenant: tenantValue,
          token: tokenValue,
          siteCode: siteCodeValue,
          pageSize: PAGE_SIZE,
        })
      ),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token, siteCode],
  })

  return { orders: value, loading, error, refetch }
}
