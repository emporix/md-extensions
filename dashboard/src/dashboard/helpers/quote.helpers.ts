import type { QuoteApiResponse } from '../api/quotes.api'
import { formatCurrency } from './chart.helpers'
import { formatRelativeDate, formatDateTimeNumeric } from './date.helpers'

export const getQuoteCustomerDisplayName = (
  quote: QuoteApiResponse
): string => {
  const c = quote?.customer
  if (!c) return '—'
  const first = typeof c.firstName === 'string' ? c.firstName.trim() : ''
  const last = typeof c.lastName === 'string' ? c.lastName.trim() : ''
  if (first || last) return [first, last].filter(Boolean).join(' ')
  if (typeof c.contactEmail === 'string' && c.contactEmail.trim())
    return c.contactEmail.trim()
  return '—'
}

export const formatQuoteStatus = (
  status: string | QuoteApiResponse['status']
): string => {
  if (status == null) return '—'
  const value = typeof status === 'string' ? status : status?.value
  if (!value || typeof value !== 'string') return '—'
  return value.toUpperCase().replace(/_/g, ' ')
}

export const formatQuoteDateForTimeline = (
  isoDate: string | undefined,
  now: Date = new Date(),
  t?: (key: string) => string
): string => formatRelativeDate(isoDate, now, t)

export const formatQuoteDate = (isoDate: string | undefined): string =>
  formatDateTimeNumeric(isoDate)

export const getQuoteCreated = (quote: QuoteApiResponse): string | undefined =>
  quote?.metadata?.createdAt

export const formatQuoteTotal = (quote: QuoteApiResponse): string => {
  const price = quote?.totalPrice
  const gross = price?.grossValue
  const currency = price?.currency ?? quote?.currency
  if (
    gross == null ||
    typeof gross !== 'number' ||
    !currency ||
    typeof currency !== 'string'
  )
    return '—'
  return formatCurrency(gross, currency, 2)
}

export const getQuotesByCountry = (
  quotes: QuoteApiResponse[]
): Map<string, number> => {
  const map = new Map<string, number>()
  for (const quote of quotes) {
    const code = quote?.shippingAddress?.countryCode
    if (code && typeof code === 'string') {
      const key = code.trim().toUpperCase()
      if (key) map.set(key, (map.get(key) ?? 0) + 1)
    }
  }
  return map
}
