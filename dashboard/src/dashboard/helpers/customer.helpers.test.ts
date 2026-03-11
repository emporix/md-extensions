import { describe, expect, it } from 'vitest'
import type { CustomerApiResponse } from '../api/customers.api'
import {
  getCustomerInitials,
  getCustomerAvatarColor,
  getCustomerDisplayName,
  formatRegistrationDate,
} from './customer.helpers'

const makeCustomer = (
  overrides: Partial<CustomerApiResponse> = {}
): CustomerApiResponse => ({
  id: 'c1',
  customerNumber: '001',
  firstName: 'Jane',
  lastName: 'Doe',
  company: null,
  contactEmail: 'jane@example.com',
  active: true,
  metadataCreatedAt: '2024-06-01T10:00:00Z',
  ...overrides,
})

describe('getCustomerInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getCustomerInitials(makeCustomer())).toBe('JD')
  })

  it('returns first letter of first name only when last name is missing', () => {
    expect(getCustomerInitials(makeCustomer({ lastName: '' }))).toBe('J')
  })

  it('falls back to email initial when names are missing', () => {
    expect(
      getCustomerInitials(
        makeCustomer({ firstName: '', lastName: '', contactEmail: 'zoe@x.com' })
      )
    ).toBe('Z')
  })

  it('returns ? when no names or email', () => {
    expect(
      getCustomerInitials(
        makeCustomer({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('?')
  })
})

describe('getCustomerAvatarColor', () => {
  it('returns a color from the palette', () => {
    const color = getCustomerAvatarColor(makeCustomer())
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns the same color for the same customer', () => {
    const customer = makeCustomer()
    expect(getCustomerAvatarColor(customer)).toBe(
      getCustomerAvatarColor(customer)
    )
  })
})

describe('getCustomerDisplayName', () => {
  it('returns full name', () => {
    expect(getCustomerDisplayName(makeCustomer())).toBe('Jane Doe')
  })

  it('returns first name only when last name is missing', () => {
    expect(getCustomerDisplayName(makeCustomer({ lastName: '' }))).toBe('Jane')
  })

  it('falls back to email when names are empty', () => {
    expect(
      getCustomerDisplayName(makeCustomer({ firstName: '', lastName: '' }))
    ).toBe('jane@example.com')
  })

  it('returns dash when no names or email', () => {
    expect(
      getCustomerDisplayName(
        makeCustomer({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('—')
  })
})

describe('formatRegistrationDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatRegistrationDate('2024-06-01T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatRegistrationDate(undefined as unknown as string)).toBe('—')
  })

  it('returns dash for invalid date', () => {
    expect(formatRegistrationDate('not-a-date')).toBe('—')
  })
})
