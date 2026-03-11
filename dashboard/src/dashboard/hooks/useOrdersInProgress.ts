import type { SalesOrderApiResponse } from '../api/orders.api'
import { fetchOrdersInProgress } from '../api/orders.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseOrdersInProgressResult = {
  orders: SalesOrderApiResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 50

export const useOrdersInProgress = (
  tenant: string | undefined,
  token: string | undefined,
  siteCode: string | undefined
): UseOrdersInProgressResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''
  const siteCodeValue = siteCode ?? ''

  const { value, loading, error, refetch } = useAsyncResource<
    SalesOrderApiResponse[]
  >({
    enabled: Boolean(tenant && token),
    initialValue: [],
    loadValue: () =>
      getOrLoad(
        `ordersInProgress:${tenantValue}:${siteCodeValue}:${PAGE_SIZE}`,
        () =>
          fetchOrdersInProgress({
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
