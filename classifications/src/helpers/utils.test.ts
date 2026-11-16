import { describe, expect, it } from 'vitest'
import {
  removeEmptyValues,
  removeObjectEmptyValues,
  textToTitleCase,
} from './utils'

describe('textToTitleCase', () => {
  it('inserts spaces between camelCase parts', () => {
    expect(textToTitleCase('bookedInPOS')).toBe('Booked In Pos')
    expect(textToTitleCase('customerFeedbackInvitationSentDate')).toBe(
      'Customer Feedback Invitation Sent Date'
    )
    expect(textToTitleCase('extendedOrderStatus')).toBe('Extended Order Status')
  })

  it('keeps spaces in already-separated labels (including German)', () => {
    expect(textToTitleCase('Erweiterter Bestellstatus')).toBe(
      'Erweiterter Bestellstatus'
    )
    expect(textToTitleCase('Im POS gebucht')).toBe('Im Pos Gebucht')
    expect(textToTitleCase('Kundenrückmeldung gesendet')).toBe(
      'Kundenrückmeldung Gesendet'
    )
  })

  it('returns empty string for empty input', () => {
    expect(textToTitleCase('')).toBe('')
    expect(textToTitleCase(undefined)).toBe('')
  })
})

describe('removeEmptyValues', () => {
  it('drops empty strings, null, and undefined', () => {
    expect(
      removeEmptyValues({
        keep: 'value',
        empty: '',
        nothing: null,
        missing: undefined,
      })
    ).toEqual({ keep: 'value' })
  })

  it('keeps falsy-but-valid values', () => {
    expect(
      removeEmptyValues({
        zero: 0,
        off: false,
        items: [],
      })
    ).toEqual({
      zero: 0,
      off: false,
      items: [],
    })
  })

  it('removes nested empty objects and nested nullables', () => {
    expect(
      removeEmptyValues({
        nested: {
          keep: 'ok',
          empty: '',
          inner: { nothing: null },
        },
        unused: {},
      })
    ).toEqual({
      nested: { keep: 'ok' },
    })
  })

  it('does not mutate the input', () => {
    const input = { keep: 'value', empty: '' }
    removeEmptyValues(input)
    expect(input).toEqual({ keep: 'value', empty: '' })
  })
})

describe('removeObjectEmptyValues', () => {
  it('mutates the object in place', () => {
    const obj: Record<string, unknown> = {
      keep: 'value',
      empty: '',
      nested: { inner: null, keep: 1 },
    }

    removeObjectEmptyValues(obj)

    expect(obj).toEqual({ keep: 'value', nested: { keep: 1 } })
  })

  it('ignores inherited enumerable properties', () => {
    const proto = { inherited: '' }
    const obj = Object.assign(Object.create(proto), {
      keep: 'value',
    }) as Record<string, unknown>

    removeObjectEmptyValues(obj)

    expect(obj.keep).toBe('value')
    expect(Object.prototype.hasOwnProperty.call(obj, 'inherited')).toBe(false)
    expect(obj.inherited).toBe('')
  })
})
