import type { ReturnApiResponse } from '../api/returns.api'
import { formatCurrency } from './chart.helpers'
import { formatDateTimeNumeric, formatStatus } from './date.helpers'

export const getReturnRequestorDisplayName = (r: ReturnApiResponse): string => {
  const req = r?.requestor
  if (!req) return '—'
  const first = typeof req.firstName === 'string' ? req.firstName.trim() : ''
  const last = typeof req.lastName === 'string' ? req.lastName.trim() : ''
  if (first || last) return [first, last].filter(Boolean).join(' ')
  if (typeof req.email === 'string' && req.email.trim()) return req.email.trim()
  return '—'
}

export const formatReturnStatus = (status: string): string =>
  formatStatus(status)

export const getReturnCreated = (r: ReturnApiResponse): string | undefined =>
  r?.metadata?.createdAt

export const formatReturnDate = (isoDate: string | undefined): string =>
  formatDateTimeNumeric(isoDate)

export const formatReturnTotal = (r: ReturnApiResponse): string => {
  const orders = r?.orders
  if (!Array.isArray(orders) || orders.length === 0) return '—'
  let totalValue = 0
  let currency = ''
  for (const o of orders) {
    const t = o?.total
    if (t && typeof t.value === 'number') {
      totalValue += t.value
      if (t.currency && typeof t.currency === 'string') currency = t.currency
    }
  }
  if (totalValue === 0 || !currency) return '—'
  return formatCurrency(totalValue, currency, 2)
}
