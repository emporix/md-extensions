import type { CartApiResponse } from '../api/carts.api'
import { formatCurrency } from './chart.helpers'
import { formatDateTimeShort } from './date.helpers'

const ABANDONED_DAYS = 3

export const getAbandonedCutoffDate = (): Date => {
  const d = new Date()
  d.setDate(d.getDate() - ABANDONED_DAYS)
  return d
}

export const getAbandonedCutoffIso = (): string =>
  getAbandonedCutoffDate().toISOString()

export const getCartCreatedAt = (cart: CartApiResponse): string | undefined =>
  cart.metadata?.createdAt

export const getCartGrossValue = (cart: CartApiResponse): number | undefined =>
  cart.calculatedPrice?.finalPrice?.grossValue

export const getCartCurrency = (cart: CartApiResponse): string =>
  cart.currency ?? 'EUR'

export const formatCartValue = (
  cart: CartApiResponse,
  maxFractionDigits = 2
): string => {
  const value = getCartGrossValue(cart)
  const currency = getCartCurrency(cart)
  if (value == null) return '—'
  return formatCurrency(value, currency, maxFractionDigits)
}

export const formatCartDate = (isoDate: string | undefined): string =>
  formatDateTimeShort(isoDate)

export const getCartCustomerDisplay = (cart: CartApiResponse): string =>
  cart.customerId ?? '—'
