import { describe, expect, it } from 'vitest'
import { couponAddPath, couponDetailPath, couponsListPath } from './paths'

describe('coupon paths', () => {
  it('addresses the list and the create page', () => {
    expect(couponsListPath()).toBe('/')
    expect(couponAddPath()).toBe('/add')
  })

  it('encodes a code into one hash path segment', () => {
    expect(couponDetailPath('SALE10')).toBe('/SALE10')
    expect(couponDetailPath('SALE#1')).toBe('/SALE%231')
    expect(couponDetailPath('A/B?C')).toBe('/A%2FB%3FC')
  })
})
