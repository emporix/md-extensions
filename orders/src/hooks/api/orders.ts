import { useCallback } from 'react'
import {
  addEntriesCall,
  changeSalesOrderStatus,
  deleteOrderCall,
  getOrder,
  getOrderInvoiceLink,
  getOrdersCall,
  getOrdersToCsv,
  getPossibleStatusChanges,
  orderDeliveryNoteCall,
  patchOrderCall,
  putOrderCall,
  recalculateOrderCall,
  sendInvoiceCall,
  sendShippingConfirmationCall,
  type OrderEntries,
  type OrderEntry,
} from '@emporix/api-calls'
import { PaginationProps, PaginatedResponse } from '../usePagination'
import { Order, OrderStatus } from '../../models/Order.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { usePermissions } from '../../context/PermissionsProvider'
import { useSites } from '../../context/SitesProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { toApiPagination } from '../../helpers/apiPagination'

// api-calls types its own (narrower) Order model; the remote keeps the full
// MD shape, so payloads/results are cast at this boundary only.
type PutOrderPayload = Parameters<typeof putOrderCall>[1]
type PatchOrderPayload = Parameters<typeof patchOrderCall>[2]
type DeliveryNotePayload = Parameters<typeof orderDeliveryNoteCall>[1]
type ShippingConfirmationPayload = Parameters<
  typeof sendShippingConfirmationCall
>[1]
type SendInvoicePayload = Parameters<typeof sendInvoiceCall>[1]

const noTenant = () => Promise.reject(new Error('No tenant'))

export const useOrdersApi = () => {
  const { tenant } = useDashboardContext()
  const { currentSite } = useSites()
  const { hasPermission } = usePermissions()
  const canViewOrders =
    hasPermission(EmployeeDomains.ORDERS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_VIEWER)

  const syncOrdersToCsv = useCallback(
    async (deliveryDateRange: {
      fromDate: string
      toDate: string
    }): Promise<Order[]> => {
      if (!tenant) return noTenant()
      const orders: Order[] = []
      let pageNumber = 1
      let totalOrderRecords = 0
      while (pageNumber === 1 || totalOrderRecords > orders.length) {
        const { values, totalRecords } = await getOrdersToCsv(
          currentSite?.code,
          tenant,
          deliveryDateRange,
          pageNumber
        )
        totalOrderRecords = totalRecords
        pageNumber++
        orders.push(...(values as unknown as Order[]))
        if (values.length === 0) break
      }
      return orders
    },
    [currentSite?.code, tenant]
  )

  const fetchOrders = useCallback(
    async (
      siteCode: string | undefined,
      pagination: Partial<PaginationProps>,
      params?: Record<string, string>
    ): Promise<PaginatedResponse<Order>> => {
      if (!canViewOrders) {
        return Promise.reject(new Error('No permissions'))
      }
      if (!tenant) return noTenant()
      return getOrdersCall(
        siteCode,
        tenant,
        toApiPagination(pagination),
        params
      ) as unknown as Promise<PaginatedResponse<Order>>
    },
    [tenant, canViewOrders]
  )

  /** Orders of the current site (MD `syncOrders`). */
  const syncOrders = useCallback(
    (pagination: Partial<PaginationProps>, params?: Record<string, string>) =>
      fetchOrders(currentSite?.code, pagination, params),
    [fetchOrders, currentSite?.code]
  )

  /** Orders of every site (MD `syncOrdersNotSiteSpecific`). */
  const syncOrdersNotSiteSpecific = useCallback(
    (pagination: Partial<PaginationProps>, params?: Record<string, string>) =>
      fetchOrders(undefined, pagination, params),
    [fetchOrders]
  )

  const syncOrder = useCallback(
    async (orderId: string): Promise<Order> => {
      if (!tenant) return noTenant()
      return getOrder(tenant, orderId) as unknown as Promise<Order>
    },
    [tenant]
  )

  const getStatusChanges = useCallback(
    async (orderId: string) => {
      if (!tenant) return noTenant()
      return getPossibleStatusChanges(tenant, orderId)
    },
    [tenant]
  )

  const changeOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      if (!tenant) return noTenant()
      return changeSalesOrderStatus(tenant, orderId, newStatus)
    },
    [tenant]
  )

  const addEntries = useCallback(
    async (orderId: string, entries: OrderEntries): Promise<Order> => {
      if (!tenant) return noTenant()
      return addEntriesCall(
        tenant,
        entries,
        orderId
      ) as unknown as Promise<Order>
    },
    [tenant]
  )

  const putOrder = useCallback(
    async (order: Partial<Order>) => {
      if (!tenant) return noTenant()
      return putOrderCall(tenant, order as unknown as PutOrderPayload)
    },
    [tenant]
  )

  const patchOrder = useCallback(
    async (orderId: string, order: Partial<Order>) => {
      if (!tenant) return noTenant()
      return patchOrderCall(
        tenant,
        orderId,
        order as unknown as PatchOrderPayload
      )
    },
    [tenant]
  )

  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!tenant) return noTenant()
      return deleteOrderCall(tenant, orderId)
    },
    [tenant]
  )

  const orderDeliveryNote = useCallback(
    async (order: Partial<Order>) => {
      if (!tenant) return noTenant()
      return orderDeliveryNoteCall(
        tenant,
        order as unknown as DeliveryNotePayload
      )
    },
    [tenant]
  )

  const sendShippingConfirmation = useCallback(
    async (order: Partial<Order>) => {
      if (!tenant) return noTenant()
      return sendShippingConfirmationCall(
        tenant,
        order as unknown as ShippingConfirmationPayload
      )
    },
    [tenant]
  )

  const sendInvoice = useCallback(
    async (order: Partial<Order>) => {
      if (!tenant) return noTenant()
      return sendInvoiceCall(tenant, order as unknown as SendInvoicePayload)
    },
    [tenant]
  )

  const recalculateOrder = useCallback(
    async (orderId: string, entries: OrderEntry[]) => {
      if (!tenant) return noTenant()
      return recalculateOrderCall(tenant, orderId, entries)
    },
    [tenant]
  )

  return {
    addEntries,
    changeOrderStatus,
    deleteOrder,
    getOrderInvoiceLink,
    getStatusChanges,
    orderDeliveryNote,
    patchOrder,
    putOrder,
    recalculateOrder,
    sendInvoice,
    sendShippingConfirmation,
    syncOrder,
    syncOrders,
    syncOrdersNotSiteSpecific,
    syncOrdersToCsv,
  }
}
