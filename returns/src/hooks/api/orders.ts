import { useCallback } from 'react'
import { getOrdersCall } from '@emporix/api-calls'
import { PaginationProps, PaginatedResponse } from '../usePagination'
import { Order } from '../../models/Order.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'

export const useOrdersApi = () => {
  const { tenant } = useDashboardContext()
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

  return { syncOrdersNotSiteSpecific }
}
