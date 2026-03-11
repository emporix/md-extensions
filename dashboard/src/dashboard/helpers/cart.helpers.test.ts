import { describe, expect, it } from 'vitest'
import type { CartApiResponse } from '../api/carts.api'
import {
  getAbandonedCutoffDate,
  getAbandonedCutoffIso,
  getCartCreatedAt,
  getCartGrossValue,
  getCartCurrency,
  formatCartValue,
  formatCartDate,
  getCartCustomerDisplay,
} from './cart.helpers'

const makeCart = (
  overrides: Partial<CartApiResponse> = {}
): CartApiResponse => ({
  id: 'c1',
  ...overrides,
})

describe('getAbandonedCutoffDate', () => {
  it('returns a date 3 days ago', () => {
    const cutoff = getAbandonedCutoffDate()
    const now = new Date()
    const diffMs = now.getTime() - cutoff.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(3)
  })
})

describe('getAbandonedCutoffIso', () => {
  it('returns valid ISO string', () => {
    const iso = getAbandonedCutoffIso()
    expect(new Date(iso).toISOString()).toBe(iso)
  })
})

describe('getCartCreatedAt', () => {
  it('returns metadata.createdAt', () => {
    const cart = makeCart({ metadata: { createdAt: '2024-01-01' } })
    expect(getCartCreatedAt(cart)).toBe('2024-01-01')
  })

  it('returns undefined when missing', () => {
    expect(getCartCreatedAt(makeCart())).toBeUndefined()
  })
})

describe('getCartGrossValue', () => {
  it('returns gross value', () => {
    const cart = makeCart({
      calculatedPrice: { finalPrice: { grossValue: 99 } },
    })
    expect(getCartGrossValue(cart)).toBe(99)
  })

  it('returns undefined when missing', () => {
    expect(getCartGrossValue(makeCart())).toBeUndefined()
  })
})

describe('getCartCurrency', () => {
  it('returns currency', () => {
    expect(getCartCurrency(makeCart({ currency: 'USD' }))).toBe('USD')
  })

  it('defaults to EUR', () => {
    expect(getCartCurrency(makeCart())).toBe('EUR')
  })
})

describe('formatCartValue', () => {
  it('formats value with currency', () => {
    const cart = makeCart({
      currency: 'EUR',
      calculatedPrice: { finalPrice: { grossValue: 42.5 } },
    })
    const result = formatCartValue(cart)
    expect(result).not.toBe('—')
  })

  it('returns dash when no value', () => {
    expect(formatCartValue(makeCart())).toBe('—')
  })
})

describe('formatCartDate', () => {
  it('returns dash for undefined', () => {
    expect(formatCartDate(undefined)).toBe('—')
  })

  it('returns formatted string for valid date', () => {
    const result = formatCartDate('2024-06-01T14:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('getCartCustomerDisplay', () => {
  it('returns customerId', () => {
    expect(getCartCustomerDisplay(makeCart({ customerId: 'cust-1' }))).toBe(
      'cust-1'
    )
  })

  it('returns dash when missing', () => {
    expect(getCartCustomerDisplay(makeCart())).toBe('—')
  })
})
