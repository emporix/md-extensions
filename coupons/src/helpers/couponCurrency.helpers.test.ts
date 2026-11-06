import { describe, expect, it } from 'vitest'
import type { Coupon } from '@emporix/api-calls'
import { fillMissingCouponCurrencies } from './couponCurrency.helpers'

const amountOnly = (amount: number) =>
  ({ amount }) as NonNullable<Coupon['discountAbsolute']>

describe('fillMissingCouponCurrencies', () => {
  it('adds the fallback currency to a minimum order value without currency', () => {
    const coupon: Partial<Coupon> = {
      restrictions: { validFor: ['c1'], minOrderValue: amountOnly(50) },
    }

    expect(fillMissingCouponCurrencies(coupon, 'EUR')).toEqual({
      restrictions: {
        validFor: ['c1'],
        minOrderValue: { amount: 50, currency: 'EUR' },
      },
    })
  })

  it('adds the fallback currency to an absolute discount without currency', () => {
    const coupon: Partial<Coupon> = {
      discountType: 'ABSOLUTE',
      discountAbsolute: amountOnly(10),
    }

    expect(fillMissingCouponCurrencies(coupon, 'EUR')).toEqual({
      discountType: 'ABSOLUTE',
      discountAbsolute: { amount: 10, currency: 'EUR' },
    })
  })

  it('keeps currencies that are already set', () => {
    const coupon: Partial<Coupon> = {
      discountAbsolute: { amount: 10, currency: 'USD' },
      restrictions: { minOrderValue: { amount: 50, currency: 'CHF' } },
    }

    expect(fillMissingCouponCurrencies(coupon, 'EUR')).toBe(coupon)
  })

  it('returns the coupon unchanged when there is no fallback currency', () => {
    const coupon: Partial<Coupon> = {
      restrictions: { minOrderValue: amountOnly(50) },
    }

    expect(fillMissingCouponCurrencies(coupon, undefined)).toBe(coupon)
  })

  it('returns the coupon unchanged when it has no money fields', () => {
    const coupon: Partial<Coupon> = {
      discountType: 'PERCENT',
      restrictions: {},
    }

    expect(fillMissingCouponCurrencies(coupon, 'EUR')).toBe(coupon)
  })

  it('returns the coupon unchanged when money fields are null', () => {
    const coupon = {
      discountType: 'PERCENT',
      discountAbsolute: null,
      restrictions: { minOrderValue: null },
    } as unknown as Partial<Coupon>

    expect(fillMissingCouponCurrencies(coupon, 'EUR')).toBe(coupon)
  })

  it('does not mutate the input coupon', () => {
    const coupon: Partial<Coupon> = {
      discountAbsolute: amountOnly(10),
      restrictions: { minOrderValue: amountOnly(50) },
    }
    const snapshot = JSON.parse(JSON.stringify(coupon))

    fillMissingCouponCurrencies(coupon, 'EUR')

    expect(coupon).toEqual(snapshot)
  })
})
