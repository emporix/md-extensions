import { describe, expect, it } from 'vitest'
import {
  getCouponDiscountTypeLabelKey,
  getPageAfterEmptyResult,
  summarizeCouponDeletes,
} from './couponsTable.helpers'

describe('getPageAfterEmptyResult', () => {
  it('moves to the last page when the current page became empty', () => {
    expect(getPageAfterEmptyResult(3, 10, 0, 20)).toBe(2)
    expect(getPageAfterEmptyResult(5, 10, 0, 21)).toBe(3)
  })

  it('stays when the page has rows or there is nothing to show', () => {
    expect(getPageAfterEmptyResult(3, 10, 4, 24)).toBeNull()
    expect(getPageAfterEmptyResult(1, 10, 0, 0)).toBeNull()
    expect(getPageAfterEmptyResult(3, 10, 0, 0)).toBeNull()
    expect(getPageAfterEmptyResult(undefined, undefined, 0, 5)).toBeNull()
  })
})

describe('summarizeCouponDeletes', () => {
  it('splits deleted and failed codes with messages', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: 'fulfilled', value: undefined },
      {
        status: 'rejected',
        reason: { response: { status: 403, data: { message: 'Forbidden' } } },
      },
      { status: 'rejected', reason: 'No tenant provided' },
    ]
    expect(summarizeCouponDeletes(['A', 'B', 'C'], results)).toEqual({
      deleted: ['A'],
      failed: [
        { code: 'B', message: 'Forbidden' },
        { code: 'C', message: 'No tenant provided' },
      ],
    })
  })
})

describe('getCouponDiscountTypeLabelKey', () => {
  it('returns translation keys for known types', () => {
    expect(getCouponDiscountTypeLabelKey('FREE_SHIPPING')).toBe(
      'coupons.type.freeShipping'
    )
    expect(getCouponDiscountTypeLabelKey('OTHER')).toBeUndefined()
    expect(getCouponDiscountTypeLabelKey(undefined)).toBeUndefined()
  })
})
