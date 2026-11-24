import { describe, expect, test } from 'vitest'
import { getSiteTimezoneOptions } from './timezone.helpers'

describe('getSiteTimezoneOptions', () => {
  test('includes Europe/Berlin and Europe/Warsaw', () => {
    const options = getSiteTimezoneOptions()
    const values = options.map((option) => option.value)

    expect(values).toContain('Europe/Berlin')
    expect(values).toContain('Europe/Warsaw')
  })

  test('uses the IANA id as value and a label with the current UTC offset', () => {
    const options = getSiteTimezoneOptions()
    const berlin = options.find((option) => option.value === 'Europe/Berlin')
    const newYork = options.find(
      (option) => option.value === 'America/New_York'
    )

    expect(options.length).toBeGreaterThan(0)
    expect(berlin?.label).toMatch(/^Europe\/Berlin \(UTC[+-]\d/)
    expect(newYork?.label).toMatch(/^America\/New_York \(UTC[+-]\d/)
    options.forEach((option) => {
      expect(option.value).toBeTruthy()
      expect(option.label.startsWith(option.value)).toBe(true)
    })
  })

  test('does not add an empty option when selected timezone is blank', () => {
    const withUndefined = getSiteTimezoneOptions()
    const withEmpty = getSiteTimezoneOptions('')

    expect(withUndefined.some((option) => option.value === '')).toBe(false)
    expect(withEmpty).toEqual(withUndefined)
  })

  test('prepends an unknown stored timezone once', () => {
    const unknownId = 'Europe/Xp'
    const options = getSiteTimezoneOptions(unknownId)
    const matches = options.filter((option) => option.value === unknownId)

    expect(matches).toHaveLength(1)
    expect(options[0].value).toBe(unknownId)
    expect(options[0].label.startsWith('Europe/Xp')).toBe(true)
  })

  test('does not duplicate a known selected timezone', () => {
    const options = getSiteTimezoneOptions('Europe/Berlin')
    const matches = options.filter((option) => option.value === 'Europe/Berlin')

    expect(matches).toHaveLength(1)
  })
})
