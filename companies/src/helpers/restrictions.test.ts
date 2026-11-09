import { describe, expect, it } from 'vitest'
import { parseRestrictions } from './restrictions'

const SCOPES = ['order.order_read', 'order.order_update']

describe('parseRestrictions', () => {
  it('returns null for an unrestricted scope', () => {
    expect(parseRestrictions(SCOPES, ['order.order_read'])).toBeNull()
  })

  it('returns the restriction codes', () => {
    expect(
      parseRestrictions(SCOPES, ['order.order_read--main#second'])
    ).toEqual(['main', 'second'])
  })

  it('returns null without any order scope', () => {
    expect(parseRestrictions(SCOPES, ['cart.cart_manage'])).toBeNull()
  })
})
