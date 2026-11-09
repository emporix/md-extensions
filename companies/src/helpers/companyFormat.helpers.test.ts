import { describe, expect, it } from 'vitest'
import { formatAddress, formatCustomerName } from './companyFormat.helpers'

describe('formatCustomerName', () => {
  it('joins name and surname', () => {
    expect(formatCustomerName({ name: 'Ann', surname: 'Lee' })).toBe('Ann Lee')
  })

  it('tolerates a missing customer', () => {
    expect(formatCustomerName(undefined)).toBe(' ')
  })
})

describe('formatAddress', () => {
  it('lists the filled parts and drops the trailing comma', () => {
    expect(
      formatAddress({
        addressLine1: 'Main 1',
        city: 'Berlin',
        postcode: 10115,
        countryCode: 'DE',
      })
    ).toBe('Main 1,  Berlin, 10115, DE')
  })
})
