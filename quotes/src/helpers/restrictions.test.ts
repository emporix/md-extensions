import { describe, expect, it } from 'vitest'
import { parseRestrictions, QUOTE_RESTRICTION_SCOPES } from './restrictions'

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

describe('quote restrictions (MD RestrictionsProvider)', () => {
  it('gives full access to an unrestricted read or manage scope', () => {
    expect(
      parseRestrictions(QUOTE_RESTRICTION_SCOPES, ['quote.quote_read'])
    ).toBeNull()
    expect(
      parseRestrictions(QUOTE_RESTRICTION_SCOPES, [
        'quote.quote_manage',
        'quote.quote_read--main',
      ])
    ).toBeNull()
  })

  it('takes the manage restriction before the read one', () => {
    expect(
      parseRestrictions(QUOTE_RESTRICTION_SCOPES, [
        'quote.quote_read--second',
        'quote.quote_manage--main#third',
      ])
    ).toEqual(['main', 'third'])
  })
})
