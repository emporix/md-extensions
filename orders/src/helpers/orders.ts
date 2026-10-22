import type { AddEntry, OrderEntries } from '@emporix/api-calls'
import type { Order } from '../models/Order.model'
import type { Product } from '../models/Product.model'

type AddEntriesFn = (orderId: string, entries: OrderEntries) => Promise<Order>

/** Sends the full entry list to the order and returns the updated order. */
export const addNewEntries = async (
  orderId: string,
  entries: AddEntry[],
  addEntries: AddEntriesFn
): Promise<Order> => {
  const updatedOrder = await addEntries(orderId, { entries })
  if (!updatedOrder) {
    throw new Error('cannot add new entries')
  }
  return { ...updatedOrder, id: orderId }
}

/** Merges products picked in the add-entry dialog into the pending entries. */
export const addNewEntriesFromProducts = (
  orderId: string,
  entries: AddEntry[],
  products: Product[],
  addEntries: AddEntriesFn
): Promise<Order> => {
  const productIds = products.map((product) => product.id)
  const entriesWithoutProducts = entries.filter(
    (entry) => !productIds.includes(entry.productId)
  )
  const entriesBasedOnProducts = products.map((product) => ({
    productId: product.id,
    quantity: product.quantity ?? 0,
  }))
  return addNewEntries(
    orderId,
    [...entriesWithoutProducts, ...entriesBasedOnProducts],
    addEntries
  )
}

/** Keeps the last entry per product id. */
export const removeDuplicatedEntries = (entries: AddEntry[]): AddEntry[] =>
  Array.from(
    entries
      .reduce((map, entry) => {
        map.set(entry.productId, entry)
        return map
      }, new Map<string, AddEntry>())
      .values()
  )

export const getTotalAuthorizedAmount = (order: Order): number | undefined => {
  if (order.totalAuthorizedAmount !== undefined) {
    return order.totalAuthorizedAmount
  }
  const payments = order.payments
  if (payments !== undefined && payments.length > 0) {
    return payments[0].authorizedAmount
  }
  return undefined
}

/** Excludes sub-orders from the list when the viewer is not a vendor. */
export const buildOrderQueryParams = (
  isVendorAware: boolean,
  vendor: string | undefined | null
): { excludeSuborders: 'true' } | undefined =>
  isVendorAware && (vendor === undefined || vendor === null)
    ? { excludeSuborders: 'true' }
    : undefined

export const formatCurrency = (
  currency: string | undefined,
  value: number | undefined,
  locale: string,
  nullText = '--'
): string => {
  if (value === undefined || !currency) return nullText
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return nullText
  }
}

/** Parses `generalAttributes.extendedOrderStatus` ("60") for action gating. */
export const extendedOrderStatusNumber = (order: Order): number =>
  Number.parseInt(
    order.mixins?.generalAttributes?.extendedOrderStatus ?? '',
    10
  )
