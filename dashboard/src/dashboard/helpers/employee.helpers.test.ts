import { describe, expect, it } from 'vitest'
import type { EmployeeApiResponse } from '../api/employees.api'
import {
  getEmployeeInitials,
  getEmployeeAvatarColor,
  getEmployeeDisplayName,
  formatDate,
} from './employee.helpers'

const makeEmployee = (
  overrides: Partial<EmployeeApiResponse> = {}
): EmployeeApiResponse => ({
  id: 'e1',
  firstName: 'Max',
  lastName: 'Mustermann',
  contactEmail: 'max@company.com',
  validFrom: '2023-01-01',
  status: 'ACTIVE',
  ...overrides,
})

describe('getEmployeeInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getEmployeeInitials(makeEmployee())).toBe('MM')
  })

  it('returns first letter only when last name is missing', () => {
    expect(getEmployeeInitials(makeEmployee({ lastName: '' }))).toBe('M')
  })

  it('falls back to email initial when names are missing', () => {
    expect(
      getEmployeeInitials(
        makeEmployee({
          firstName: '',
          lastName: '',
          contactEmail: 'anna@x.com',
        })
      )
    ).toBe('A')
  })

  it('returns ? when no names or email', () => {
    expect(
      getEmployeeInitials(
        makeEmployee({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('?')
  })
})

describe('getEmployeeAvatarColor', () => {
  it('returns a hex color from the palette', () => {
    const color = getEmployeeAvatarColor(makeEmployee())
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns the same color for the same employee', () => {
    const employee = makeEmployee()
    expect(getEmployeeAvatarColor(employee)).toBe(
      getEmployeeAvatarColor(employee)
    )
  })
})

describe('getEmployeeDisplayName', () => {
  it('returns full name', () => {
    expect(getEmployeeDisplayName(makeEmployee())).toBe('Max Mustermann')
  })

  it('returns first name only when last name is missing', () => {
    expect(getEmployeeDisplayName(makeEmployee({ lastName: '' }))).toBe('Max')
  })

  it('falls back to email when names are empty', () => {
    expect(
      getEmployeeDisplayName(makeEmployee({ firstName: '', lastName: '' }))
    ).toBe('max@company.com')
  })

  it('returns dash when no names or email', () => {
    expect(
      getEmployeeDisplayName(
        makeEmployee({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-03-15T09:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns dash for invalid date', () => {
    expect(formatDate('invalid')).toBe('—')
  })
})
