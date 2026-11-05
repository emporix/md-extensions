import { useCallback } from 'react'
import { getOrder, getOrdersCall } from '@emporix/api-calls'
import { PaginationProps, PaginatedResponse } from '../usePagination'
import { Order } from '../../models/Order.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { useSites } from '../../context/SitesProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'

/** Lean order shape — only what the mixin reference selector reads. */
export interface OrderSummary {
  id: string
}

export const useOrdersApi = () => {
  const { tenant } = useDashboardContext()
  const { currentSite } = useSites()
  const { hasPermission } = usePermissions()
  const canViewOrders =
    hasPermission(EmployeeDomains.ORDERS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_VIEWER)

  /**
   * Returns can be raised against orders from any site, so the site code is
   * deliberately left undefined (matches MD `syncOrdersNotSiteSpecific`).
   */
  const syncOrdersNotSiteSpecific = useCallback(
    async (
      pagination: Partial<PaginationProps>,
      params?: Record<string, string>
    ): Promise<PaginatedResponse<Order>> => {
      if (!canViewOrders) {
        return Promise.reject(new Error('No permissions'))
      }
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      return getOrdersCall(
        undefined,
        tenant,
        toApiPagination(pagination),
        params
      ) as unknown as Promise<PaginatedResponse<Order>>
    },
    [tenant, canViewOrders]
  )

  /** Orders of the current site, for the mixin reference selector (MD `syncOrders`). */
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

  return { syncOrdersNotSiteSpecific, syncOrder, syncOrders, getAllOrders }
}
