import type { SalesOrderApiResponse } from '../api/orders.api'
import { formatCurrency } from './chart.helpers'
import {
  formatRelativeDate,
  formatDateTimeNumeric,
  formatStatus,
} from './date.helpers'

export const getOrderCustomerDisplayName = (
  order: SalesOrderApiResponse
): string => {
  const c = order?.customer
  if (!c) return '—'
  if (typeof c.name === 'string' && c.name.trim()) return c.name.trim()
  const first = typeof c.firstName === 'string' ? c.firstName.trim() : ''
  const last = typeof c.lastName === 'string' ? c.lastName.trim() : ''
  if (first || last) return [first, last].filter(Boolean).join(' ')
  if (typeof c.email === 'string' && c.email.trim()) return c.email.trim()
  return '—'
}

export const formatOrderStatus = (status: string): string =>
  formatStatus(status)

export const formatOrderDateForTimeline = (
  isoDate: string | undefined,
  now: Date = new Date(),
  t?: (key: string) => string
): string => formatRelativeDate(isoDate, now, t)

export const formatOrderDate = (isoDate: string | undefined): string =>
  formatDateTimeNumeric(isoDate)

export const getOrderCreated = (
  order: SalesOrderApiResponse
): string | undefined => order?.created

export const getOrdersByCountry = (
  orders: SalesOrderApiResponse[]
): Map<string, number> => {
  const map = new Map<string, number>()
  for (const order of orders) {
    const code = order?.shippingAddress?.country
    if (code && typeof code === 'string') {
      const key = code.trim().toUpperCase()
      if (key) map.set(key, (map.get(key) ?? 0) + 1)
    }
  }
  return map
}

export const formatOrderTotal = (order: SalesOrderApiResponse): string => {
  const gross = order?.calculatedPrice?.finalPrice?.grossValue
  const currency = order?.currency
  if (
    gross == null ||
    typeof gross !== 'number' ||
    !currency ||
    typeof currency !== 'string'
  )
    return '—'
  return formatCurrency(gross, currency, 2)
}
