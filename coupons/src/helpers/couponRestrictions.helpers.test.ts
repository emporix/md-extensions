import { describe, expect, it } from 'vitest'
import {
  getCouponAppliesToFlags,
  getCouponAppliesToListKeys,
} from './couponRestrictions.helpers'

describe('getCouponAppliesToFlags', () => {
  it('keeps the flags of the old radio handlers', () => {
    expect(getCouponAppliesToFlags('SEGMENTS')).toEqual({
      allowAnonymous: true,
      segmentRestricted: true,
      categoryRestricted: false,
    })
    expect(getCouponAppliesToFlags('SPECIFIC_CUSTOMERS')).toEqual({
      allowAnonymous: false,
      segmentRestricted: false,
      categoryRestricted: false,
    })
  })

  it('returns a copy', () => {
    const flags = getCouponAppliesToFlags('ALL_CUSTOMERS')
    flags.allowAnonymous = false
    expect(getCouponAppliesToFlags('ALL_CUSTOMERS').allowAnonymous).toBe(true)
  })
})

describe('getCouponAppliesToListKeys', () => {
  it('lists the restriction lists of each option', () => {
    expect(getCouponAppliesToListKeys('CATEGORIES')).toEqual([
      'includedCategories',
      'excludedCategories',
    ])
    expect(getCouponAppliesToListKeys('REGISTERED_CUSTOMERS')).toEqual([])
  })
})
