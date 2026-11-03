import { useCallback } from 'react'
import { getOrder, getOrdersCall } from '@emporix/api-calls'
import { PaginatedResponse, PaginationProps } from '../usePagination'
import { useSites } from '../../context/SitesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { toApiPagination } from '../../helpers/apiPagination'

/** Lean order shape — only what the mixin reference selector reads. */
export interface OrderSummary {
  id: string
}

/** Lean port of MD `hooks/api/orders` — only the calls the mixins reference selector uses. */
export const useOrdersApi = () => {
  const { currentSite } = useSites()
  const { tenant } = useDashboardContext()
  const { hasPermission } = usePermissions()
  const canViewOrders =
    hasPermission(EmployeeDomains.ORDERS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_VIEWER)

  const syncOrders = useCallback(
    async (
      pagination: Partial<PaginationProps>,
      params?: Record<string, string>
    ): Promise<PaginatedResponse<OrderSummary>> => {
      if (tenant && canViewOrders) {
        return getOrdersCall(
          currentSite?.code,
          tenant,
          toApiPagination(pagination),
          params
        )
      } else if (!canViewOrders) {
        return Promise.reject('No permissions')
      } else {
        return Promise.reject('No tenant')
      }
    },
    [currentSite, tenant, canViewOrders]
  )

  const getAllOrders = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<OrderSummary[]> =>
      fetchAllRecords((p) => syncOrders(p), {
        currentPage: 1,
        rows: 100,
        ...pagination,
      }),
    [syncOrders]
  )

  const syncOrder = useCallback(
    async (orderId: string): Promise<OrderSummary> => {
      if (tenant) {
        return getOrder(tenant, orderId)
      } else {
        return Promise.reject('No tenant')
      }
    },
    [tenant]
  )

  return { syncOrder, syncOrders, getAllOrders }
}
