import { describe, expect, it } from 'vitest'
import { createCouponForm } from './couponForm.helpers'
import {
  validateAppliesTo,
  validateCouponCode,
  validateCouponName,
  validateDiscountAmount,
  validateDiscountPercentage,
  validateExcludedCategories,
  validateMinOrderAmount,
  validateValidUntil,
} from './couponValidation.helpers'

const KEY = 'coupons.edit.validation'
const form = createCouponForm()

describe('validateCouponName', () => {
  it('requires a non-blank name', () => {
    expect(validateCouponName('Summer')).toBe(true)
    expect(validateCouponName('   ')).toBe(`${KEY}.required`)
  })
})

describe('validateCouponCode', () => {
  it('rejects the reserved route segment on create only', () => {
    expect(validateCouponCode(' ADD ', true)).toBe(`${KEY}.codeReserved`)
    expect(validateCouponCode('add', false)).toBe(true)
    expect(validateCouponCode('ADDON', true)).toBe(true)
    expect(validateCouponCode('', true)).toBe(true)
  })
})

describe('validateDiscountPercentage', () => {
  const percent = { discountType: 'PERCENT' as const }

  it('checks the range only for percentage coupons', () => {
    expect(validateDiscountPercentage(null, percent)).toBe(`${KEY}.required`)
    expect(validateDiscountPercentage(-1, percent)).toBe(
      `${KEY}.percentageRange`
    )
    expect(validateDiscountPercentage(100.01, percent)).toBe(
      `${KEY}.percentageRange`
    )
    expect(validateDiscountPercentage(0, percent)).toBe(true)
    expect(validateDiscountPercentage(100, percent)).toBe(true)
    expect(validateDiscountPercentage(null, form)).toBe(true)
  })
})

describe('validateDiscountAmount', () => {
  it('requires a non-negative amount for absolute coupons', () => {
    expect(validateDiscountAmount(null, form)).toBe(`${KEY}.required`)
    expect(validateDiscountAmount(-5, form)).toBe(`${KEY}.amountNonNegative`)
    expect(validateDiscountAmount(0, form)).toBe(true)
    expect(
      validateDiscountAmount(null, { discountType: 'FREE_SHIPPING' })
    ).toBe(true)
  })
})

describe('validateMinOrderAmount', () => {
  it('allows an empty or non-negative minimum', () => {
    expect(validateMinOrderAmount(null)).toBe(true)
    expect(validateMinOrderAmount(0)).toBe(true)
    expect(validateMinOrderAmount(-1)).toBe(`${KEY}.amountNonNegative`)
  })
})

describe('validateValidUntil', () => {
  const validFrom = new Date('2026-01-10T00:00:00Z')

  it('rejects an end date before the start date', () => {
    expect(
      validateValidUntil(new Date('2026-01-09T00:00:00Z'), { validFrom })
    ).toBe(`${KEY}.validityOrder`)
    expect(validateValidUntil(validFrom, { validFrom })).toBe(true)
    expect(validateValidUntil(null, { validFrom })).toBe(true)
    expect(validateValidUntil(validFrom, { validFrom: null })).toBe(true)
  })
})

describe('validateAppliesTo', () => {
  it.each([
    ['SPECIFIC_CUSTOMERS', `${KEY}.customersRequired`],
    ['SEGMENTS', `${KEY}.segmentsRequired`],
    ['CATEGORIES', `${KEY}.categoriesRequired`],
  ] as const)('requires a list for %s', (option, expected) => {
    expect(validateAppliesTo(option, form)).toBe(expected)
  })

  it('accepts options with their list filled', () => {
    expect(validateAppliesTo('SEGMENTS', { ...form, segments: ['S-1'] })).toBe(
      true
    )
    expect(validateAppliesTo('ALL_CUSTOMERS', form)).toBe(true)
  })

  it('accepts categories with only excluded categories', () => {
    expect(
      validateAppliesTo('CATEGORIES', { ...form, excludedCategories: ['sale'] })
    ).toBe(true)
  })

  it('rejects categories for free shipping', () => {
    expect(
      validateAppliesTo('CATEGORIES', {
        ...form,
        discountType: 'FREE_SHIPPING',
        includedCategories: ['shoes'],
      })
    ).toBe(`${KEY}.categoriesNotForFreeShipping`)
  })
})

describe('validateExcludedCategories', () => {
  it('rejects categories that are also included', () => {
    const categories = {
      appliesTo: 'CATEGORIES' as const,
      includedCategories: ['shoes'],
    }
    expect(validateExcludedCategories(['shoes'], categories)).toBe(
      `${KEY}.categoriesOverlap`
    )
    expect(validateExcludedCategories(['sale'], categories)).toBe(true)
    expect(
      validateExcludedCategories(['shoes'], {
        ...categories,
        appliesTo: 'ALL_CUSTOMERS',
      })
    ).toBe(true)
  })
})
