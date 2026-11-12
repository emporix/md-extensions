import { describe, expect, it } from 'vitest'
import { createUnitForm, hasName, toUnitPayload } from './Unit.model'

describe('Unit model', () => {
  it('starts a new unit with MD defaults', () => {
    expect(createUnitForm()).toEqual({
      code: '',
      name: {},
      type: '',
      symbol: '',
      baseUnit: false,
      factor: 1,
    })
  })

  it('accepts a name in any one language', () => {
    expect(hasName({ en: 'Kilogram', de: '' })).toBe(true)
    expect(hasName({ en: '', de: 'Kilogramm' })).toBe(true)
    expect(hasName({ en: ' ', de: '' })).toBe(false)
    expect(hasName({})).toBe(false)
    expect(hasName(undefined)).toBe(false)
  })

  it('sends the loaded version on update and none on create', () => {
    const form = {
      code: 'kg',
      name: { en: 'Kilogram' },
      type: 'mass',
      symbol: '',
      baseUnit: true,
      factor: 1,
    }
    expect(toUnitPayload(form)).toEqual({
      code: 'kg',
      name: { en: 'Kilogram' },
      type: 'mass',
      baseUnit: true,
      factor: 1,
    })
    expect(
      toUnitPayload(
        { ...form, symbol: 'kg' },
        { ...form, metadata: { version: 3 } }
      )
    ).toEqual({
      code: 'kg',
      name: { en: 'Kilogram' },
      type: 'mass',
      symbol: 'kg',
      baseUnit: true,
      factor: 1,
      metadata: { version: 3 },
    })
  })
})
