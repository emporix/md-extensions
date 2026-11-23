import { describe, expect, it } from 'vitest'
import {
  createTaxClassForm,
  toTaxClass,
  toTaxRow,
  toTaxUpdate,
  type Tax,
} from './Tax.model'

const tax: Tax = {
  locationCode: 'DE',
  location: { countryCode: 'DE' },
  taxClasses: [{ code: 'A', name: { en: 'A' }, rate: 1 }],
  metadata: { version: 5, createdAt: 'x' },
}

describe('Tax model', () => {
  it('starts a new class with rate 0 and the chosen country', () => {
    expect(createTaxClassForm('DE')).toEqual({
      countryCode: 'DE',
      code: '',
      rate: 0,
      name: {},
      description: {},
    })
  })

  it('fills the form from a stored class', () => {
    expect(
      createTaxClassForm('DE', {
        code: 'A',
        name: { en: 'A' },
        description: { en: 'd' },
        rate: 7,
      })
    ).toEqual({
      countryCode: 'DE',
      code: 'A',
      rate: 7,
      name: { en: 'A' },
      description: { en: 'd' },
    })
  })

  it('leaves out an empty description', () => {
    expect(
      toTaxClass({
        countryCode: 'DE',
        code: 'A',
        rate: null,
        name: { en: 'A' },
        description: { en: ' ' },
      })
    ).toEqual({ code: 'A', rate: 0, name: { en: 'A' } })
  })

  it('keeps the stored fields of the class it changes, except a cleared description', () => {
    expect(
      toTaxClass(
        {
          countryCode: 'DE',
          code: 'A',
          rate: 2,
          name: { en: 'B' },
          description: {},
        },
        {
          code: 'A',
          name: { en: 'A' },
          description: { en: 'old' },
          rate: 1,
          order: 3,
          isDefault: true,
        }
      )
    ).toEqual({
      code: 'A',
      name: { en: 'B' },
      rate: 2,
      order: 3,
      isDefault: true,
    })
  })

  it('sends only the version of the record with an update', () => {
    expect(toTaxUpdate(tax, [])).toEqual({
      location: { countryCode: 'DE' },
      taxClasses: [],
      metadata: { version: 5 },
    })
  })

  it('keys a row by its country code', () => {
    expect(toTaxRow(tax, { en: 'Germany' })).toEqual({
      ...tax,
      countryCode: 'DE',
      countryName: { en: 'Germany' },
    })
  })
})
