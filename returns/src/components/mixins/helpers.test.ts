import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  createForm,
  defaultValueForMixinItem,
  MixinsFormItem,
  MixinsFormItemType,
  omitUnsetEmptyValues,
  parseNumberInputText,
} from './helpers'

const item = (
  overrides: Partial<MixinsFormItem> & Pick<MixinsFormItem, 'key' | 'type'>
): MixinsFormItem => ({
  name: overrides.key,
  isRequired: false,
  ...overrides,
})

describe('createForm', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('leaves date and date-time fields without data unset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-17T13:08:00.000Z'))

    const form = createForm([
      item({ key: 'date', type: MixinsFormItemType.date, isRequired: true }),
      item({
        key: 'dateTime',
        type: MixinsFormItemType.dateTime,
        isRequired: true,
      }),
    ])

    expect(form.date).toBeUndefined()
    expect(form.dateTime).toBeUndefined()
  })

  it('leaves enum fields without data unset', () => {
    const form = createForm([
      item({
        key: 'size',
        type: MixinsFormItemType.enum,
        enum: ['S', 'M', 'L'],
        isRequired: true,
      }),
    ])

    expect(form.size).toBeUndefined()
  })

  it('leaves text and time fields without data unset', () => {
    const form = createForm([
      item({ key: 'text', type: MixinsFormItemType.text, isRequired: true }),
      item({ key: 'time', type: MixinsFormItemType.time }),
    ])

    expect(form.text).toBeUndefined()
    expect(form.time).toBeUndefined()
  })

  it('leaves number fields without data unset', () => {
    const form = createForm([
      item({
        key: 'number',
        type: MixinsFormItemType.integer,
        isRequired: true,
      }),
      item({ key: 'decimal', type: MixinsFormItemType.decimal }),
    ])

    expect(form.number).toBeUndefined()
    expect(form.decimal).toBeUndefined()
  })

  it('leaves boolean fields without data unset', () => {
    const booleanItem = item({
      key: 'boolean',
      type: MixinsFormItemType.boolean,
    })
    const form = createForm([
      item({ key: 'advertisement', type: MixinsFormItemType.localized }),
      booleanItem,
    ])

    expect(form.boolean).toBeUndefined()
    expect(
      defaultValueForMixinItem(
        { ...booleanItem, type: MixinsFormItemType.array },
        false
      )
    ).toEqual([])
    expect(
      defaultValueForMixinItem(
        {
          ...booleanItem,
          type: MixinsFormItemType.array,
          arrayType: MixinsFormItemType.boolean,
        },
        true
      )
    ).toBe(false)
  })
})

describe('enum defaults', () => {
  const sizeItem = item({
    key: 'size',
    type: MixinsFormItemType.enum,
    enum: ['S', 'M', 'L'],
  })

  it('leaves an empty enum out of the save payload', () => {
    const payload = applyDefaultsOnEmptyFields({ size: undefined }, [sizeItem])

    expect(payload).not.toHaveProperty('size')
  })

  it('starts a newly added enum array entry with the first option', () => {
    const arrayItem = item({
      key: 'sizes',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.enum,
      enum: ['S', 'M', 'L'],
    })

    expect(defaultValueForMixinItem(arrayItem, true)).toBe('S')
  })
})

describe('text defaults', () => {
  const textItem = item({ key: 'text', type: MixinsFormItemType.text })
  const timeItem = item({ key: 'time', type: MixinsFormItemType.time })

  it('leaves empty text and time fields out of the save payload', () => {
    const payload = applyDefaultsOnEmptyFields(
      { text: '', time: undefined, nested: { text: '' } },
      [
        textItem,
        timeItem,
        item({
          key: 'nested',
          type: MixinsFormItemType.object,
          items: [item({ key: 'nested.text', type: MixinsFormItemType.text })],
        }),
      ]
    )

    expect(payload).toEqual({ nested: {} })
  })

  it('starts a newly added text array entry with an empty string', () => {
    const arrayItem = item({
      key: 'texts',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.text,
    })

    expect(defaultValueForMixinItem(arrayItem, true)).toBe('')
  })
})

describe('number and date defaults', () => {
  it('leaves empty number and date fields out of the save payload', () => {
    const payload = applyDefaultsOnEmptyFields(
      { int: null, dec: undefined, date: undefined, dateTime: null },
      [
        item({ key: 'int', type: MixinsFormItemType.integer }),
        item({ key: 'dec', type: MixinsFormItemType.decimal }),
        item({ key: 'date', type: MixinsFormItemType.date }),
        item({ key: 'dateTime', type: MixinsFormItemType.dateTime }),
      ]
    )

    expect(payload).toEqual({})
  })

  it('keeps a stored 0', () => {
    const payload = applyDefaultsOnEmptyFields({ int: 0 }, [
      item({ key: 'int', type: MixinsFormItemType.integer }),
    ])

    expect(payload).toEqual({ int: 0 })
  })

  it('starts a newly added number array entry with 0', () => {
    const arrayItem = item({
      key: 'ints',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.integer,
    })

    expect(defaultValueForMixinItem(arrayItem, true)).toBe(0)
  })
})

describe('parseNumberInputText', () => {
  it('parses formatted numbers of the given locale', () => {
    expect(parseNumberInputText('1,234.5', 'en')).toBe(1234.5)
    expect(parseNumberInputText('1.234,5', 'de')).toBe(1234.5)
    expect(parseNumberInputText('-7', 'en')).toBe(-7)
  })

  it('returns null for empty or unparsable text', () => {
    expect(parseNumberInputText('', 'en')).toBeNull()
    expect(parseNumberInputText('-', 'en')).toBeNull()
    expect(parseNumberInputText('abc', 'en')).toBeNull()
  })
})

describe('omitUnsetEmptyValues', () => {
  const items = [
    item({ key: 'text', type: MixinsFormItemType.text, isNullable: true }),
    item({ key: 'flag', type: MixinsFormItemType.boolean }),
    item({ key: 'tags', type: MixinsFormItemType.array }),
    item({
      key: 'loc',
      type: MixinsFormItemType.localized,
      localizedVersion: 'v2',
    }),
    item({
      key: 'ref',
      type: MixinsFormItemType.reference,
      referenceType: 'PRODUCT',
    }),
    item({
      key: 'dims',
      type: MixinsFormItemType.object,
      items: [
        item({ key: 'dims.w', type: MixinsFormItemType.integer }),
        item({
          key: 'dims.n',
          type: MixinsFormItemType.text,
          isNullable: true,
        }),
      ],
    }),
    item({
      key: 'rows',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.object,
      items: [item({ key: 'n', type: MixinsFormItemType.text })],
    }),
  ]
  const emptyPayload = {
    text: null,
    flag: false,
    tags: [],
    loc: { en: null },
    ref: { emporixReferenceType: 'PRODUCT', id: '' },
    dims: { n: null },
    rows: [{ n: null }],
  }

  it('leaves out empty values of attributes without stored data', () => {
    expect(omitUnsetEmptyValues(emptyPayload, undefined, items)).toEqual({
      flag: false,
      rows: [{ n: null }],
    })
  })

  it('keeps empty values of attributes with stored data (cleared by the user)', () => {
    const stored = {
      text: 'a',
      tags: ['x'],
      loc: { en: 'Hi' },
      ref: { emporixReferenceType: 'PRODUCT', id: 'p1' },
      dims: { n: 'b' },
    }

    expect(omitUnsetEmptyValues(emptyPayload, stored, items)).toEqual(
      emptyPayload
    )
  })
})
