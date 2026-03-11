import { describe, expect, it } from 'vitest'
import {
  getInitials,
  getAvatarColor,
  getDisplayName,
  type PersonLike,
} from './person.helpers'

const makePerson = (overrides: Partial<PersonLike> = {}): PersonLike => ({
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  contactEmail: 'john@example.com',
  ...overrides,
})

describe('getInitials', () => {
  it('returns first letter of first and last name', () => {
    expect(getInitials(makePerson())).toBe('JD')
  })

  it('returns first name initial when lastName is missing', () => {
    expect(getInitials(makePerson({ lastName: undefined }))).toBe('J')
  })

  it('returns last name initial when firstName is missing', () => {
    expect(getInitials(makePerson({ firstName: undefined }))).toBe('D')
  })

  it('falls back to email initial when no names', () => {
    expect(
      getInitials(makePerson({ firstName: undefined, lastName: undefined }))
    ).toBe('J')
  })

  it('returns ? when no names and no email', () => {
    expect(
      getInitials(
        makePerson({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('?')
  })

  it('trims whitespace from names', () => {
    expect(
      getInitials(makePerson({ firstName: '  Alice  ', lastName: '  B  ' }))
    ).toBe('AB')
  })
})

describe('getAvatarColor', () => {
  const colors = ['#aaa', '#bbb', '#ccc']

  it('returns a color from the provided palette', () => {
    const color = getAvatarColor(makePerson(), colors)
    expect(colors).toContain(color)
  })

  it('returns the same color for the same person', () => {
    const a = getAvatarColor(makePerson(), colors)
    const b = getAvatarColor(makePerson(), colors)
    expect(a).toBe(b)
  })

  it('returns different colors for different people', () => {
    const a = getAvatarColor(makePerson({ id: '1', firstName: 'A' }), colors)
    const b = getAvatarColor(makePerson({ id: '2', firstName: 'Z' }), colors)
    expect(typeof a).toBe('string')
    expect(typeof b).toBe('string')
  })
})

describe('getDisplayName', () => {
  it('returns full name', () => {
    expect(getDisplayName(makePerson())).toBe('John Doe')
  })

  it('returns first name only when no last name', () => {
    expect(getDisplayName(makePerson({ lastName: undefined }))).toBe('John')
  })

  it('returns last name only when no first name', () => {
    expect(getDisplayName(makePerson({ firstName: undefined }))).toBe('Doe')
  })

  it('falls back to email', () => {
    expect(
      getDisplayName(makePerson({ firstName: undefined, lastName: undefined }))
    ).toBe('john@example.com')
  })

  it('returns dash when nothing available', () => {
    expect(
      getDisplayName(
        makePerson({
          firstName: undefined,
          lastName: undefined,
          contactEmail: undefined,
        })
      )
    ).toBe('—')
  })

  it('trims whitespace', () => {
    expect(
      getDisplayName(makePerson({ firstName: '  Alice  ', lastName: '  B  ' }))
    ).toBe('Alice B')
  })
})
