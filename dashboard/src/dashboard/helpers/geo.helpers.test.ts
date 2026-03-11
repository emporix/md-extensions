import { describe, expect, it } from 'vitest'
import { getFlagEmoji, getCountsByMapId, getMapIdToIso2 } from './geo.helpers'

describe('getFlagEmoji', () => {
  it('returns flag emoji for valid 2-letter code', () => {
    const flag = getFlagEmoji('US')
    expect(flag.length).toBeGreaterThan(0)
  })

  it('returns empty string for invalid input', () => {
    expect(getFlagEmoji('')).toBe('')
    expect(getFlagEmoji('A')).toBe('')
    expect(getFlagEmoji('ABC')).toBe('')
  })
})

describe('getCountsByMapId', () => {
  it('merges order and quote counts by map ID', () => {
    const orders = new Map([['DE', 3]])
    const quotes = new Map([['DE', 2]])
    const result = getCountsByMapId(orders, quotes)
    const deEntry = [...result.values()].find(
      (v) => v.orders === 3 && v.quotes === 2
    )
    expect(deEntry).toBeDefined()
  })

  it('returns empty map for empty inputs', () => {
    const result = getCountsByMapId(new Map(), new Map())
    expect(result.size).toBe(0)
  })
})

describe('getMapIdToIso2', () => {
  it('returns a record mapping IDs to ISO2 codes', () => {
    const map = getMapIdToIso2()
    expect(typeof map).toBe('object')
    const values = Object.values(map)
    expect(values.length).toBeGreaterThan(0)
    expect(values.every((v) => v.length === 2)).toBe(true)
  })
})
