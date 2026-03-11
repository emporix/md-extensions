import { describe, expect, it } from 'vitest'
import type { QuoteApiResponse } from '../api/quotes.api'
import {
  getQuoteCustomerDisplayName,
  formatQuoteStatus,
  formatQuoteDateForTimeline,
  formatQuoteDate,
  getQuoteCreated,
  formatQuoteTotal,
  getQuotesByCountry,
} from './quote.helpers'

const makeQuote = (
  overrides: Partial<QuoteApiResponse> = {}
): QuoteApiResponse => ({
  id: 'q1',
  status: { value: 'OPEN' },
  ...overrides,
})

describe('getQuoteCustomerDisplayName', () => {
  it('returns first + last', () => {
    const quote = makeQuote({
      customer: { firstName: 'John', lastName: 'Smith' },
    })
    expect(getQuoteCustomerDisplayName(quote)).toBe('John Smith')
  })

  it('falls back to contactEmail', () => {
    const quote = makeQuote({
      customer: { contactEmail: 'j@test.com' },
    })
    expect(getQuoteCustomerDisplayName(quote)).toBe('j@test.com')
  })

  it('returns dash when no customer', () => {
    expect(getQuoteCustomerDisplayName(makeQuote())).toBe('—')
  })
})

describe('formatQuoteStatus', () => {
  it('formats string status', () => {
    expect(formatQuoteStatus('in_progress')).toBe('IN PROGRESS')
  })

  it('formats object status', () => {
    expect(formatQuoteStatus({ value: 'accepted' })).toBe('ACCEPTED')
  })

  it('returns dash for null', () => {
    expect(formatQuoteStatus(null as unknown as string)).toBe('—')
  })
})

describe('formatQuoteDateForTimeline', () => {
  it('returns Today for same-day date', () => {
    const now = new Date('2024-06-15T12:00:00Z')
    expect(formatQuoteDateForTimeline('2024-06-15T08:00:00Z', now)).toBe(
      'Today'
    )
  })
})

describe('formatQuoteDate', () => {
  it('returns dash for undefined', () => {
    expect(formatQuoteDate(undefined)).toBe('—')
  })
})

describe('getQuoteCreated', () => {
  it('returns metadata.createdAt', () => {
    const quote = makeQuote({ metadata: { createdAt: '2024-01-01' } })
    expect(getQuoteCreated(quote)).toBe('2024-01-01')
  })

  it('returns undefined when missing', () => {
    expect(getQuoteCreated(makeQuote())).toBeUndefined()
  })
})

describe('formatQuoteTotal', () => {
  it('formats gross value', () => {
    const quote = makeQuote({
      totalPrice: { grossValue: 150, currency: 'USD' },
    })
    const result = formatQuoteTotal(quote)
    expect(result).not.toBe('—')
  })

  it('returns dash when no total price', () => {
    expect(formatQuoteTotal(makeQuote())).toBe('—')
  })
})

describe('getQuotesByCountry', () => {
  it('aggregates quotes by country code', () => {
    const quotes = [
      makeQuote({ shippingAddress: { countryCode: 'DE' } }),
      makeQuote({ shippingAddress: { countryCode: 'DE' } }),
      makeQuote({ shippingAddress: { countryCode: 'FR' } }),
    ]
    const map = getQuotesByCountry(quotes)
    expect(map.get('DE')).toBe(2)
    expect(map.get('FR')).toBe(1)
  })

  it('returns empty map for no quotes', () => {
    expect(getQuotesByCountry([]).size).toBe(0)
  })
})
