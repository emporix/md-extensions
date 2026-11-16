import { describe, expect, it } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  filterOutDeletedMixins,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { serializeLocalizedFields } from './localizedMixin.helpers'

// The form keeps each array element in an { id, value } row. Any other object
// with `id` and `value` fields is a value of its own and must survive a save.

const text = (key: string): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.text,
  isRequired: false,
})

const idValueFields = (prefix = ''): MixinsFormItem[] => [
  text(`${prefix}id`),
  text(`${prefix}value`),
]

const roundTrip = (data: Record<string, unknown>) =>
  convertFromIdValuePair(convertToIdValuePair(data))

describe('convertFromIdValuePair', () => {
  it('keeps a localized OBJECT language entry with id and value fields', () => {
    const data = { addr: { en: { id: 'A', value: 'B' }, de: null } }

    expect(convertFromIdValuePair(data)).toEqual(data)
  })

  it('keeps an object field with id and value fields', () => {
    const data = {
      obj: { id: 'A', value: 'B' },
      nested: { id: 'C', value: { x: 1 } },
    }

    expect(convertFromIdValuePair(data)).toEqual(data)
  })

  it('keeps an object with id and value fields inside an array row', () => {
    expect(
      convertFromIdValuePair({
        rows: [{ id: 'row-1', value: { inner: { id: 'A', value: 'B' } } }],
      })
    ).toEqual({ rows: [{ inner: { id: 'A', value: 'B' } }] })
  })

  it('unwraps array rows', () => {
    expect(
      convertFromIdValuePair({
        tags: [
          { id: '1', value: 'red' },
          { id: '2', value: null },
        ],
        refs: [
          { id: '3', value: { emporixReferenceType: 'PRODUCT', id: 'p-1' } },
        ],
        rows: [
          {
            id: '4',
            value: { title: 'Sole', tags: [{ id: '5', value: 'x' }] },
          },
        ],
        pieces: [{ id: '6', value: [{ language: 'en', value: 'Hi' }] }],
        addrs: [{ id: '7', value: { en: { city: 'Berlin' } } }],
      })
    ).toEqual({
      tags: ['red', null],
      refs: [{ emporixReferenceType: 'PRODUCT', id: 'p-1' }],
      rows: [{ title: 'Sole', tags: ['x'] }],
      pieces: [[{ language: 'en', value: 'Hi' }]],
      addrs: [{ en: { city: 'Berlin' } }],
    })
  })
})

describe('convertToIdValuePair', () => {
  it('wraps array items with id and value fields instead of dropping them', () => {
    expect(
      convertToIdValuePair({ attrs: [{ id: 'color', value: 'red' }] })
    ).toEqual({
      attrs: [{ id: expect.any(String), value: { id: 'color', value: 'red' } }],
    })
  })
})

describe('id/value pair round trip', () => {
  it.each([
    ['an object field', { obj: { id: 'A', value: 'B' } }],
    ['an object holding an object', { obj: { id: 'A', value: { x: 1 } } }],
    ['an object holding an array', { obj: { id: 'A', value: ['x'] } }],
    ['a localized OBJECT', { addr: { en: { id: 'A', value: 'B' }, de: null } }],
    [
      'an array of localized OBJECTs',
      { addrs: [{ en: { id: 'A', value: 'B' } }] },
    ],
    [
      'an array of objects',
      {
        attrs: [
          { id: 'color', value: 'red' },
          { id: 'size', value: 42 },
        ],
      },
    ],
    [
      'an object inside an array row',
      { rows: [{ inner: { id: 'A', value: 'B' } }] },
    ],
  ])('keeps the id and value fields of %s', (_, data) => {
    expect(roundTrip(data)).toEqual(data)
  })
})

describe('mixin save chain with id and value fields', () => {
  const items: MixinsFormItem[] = [
    {
      name: 'addr',
      key: 'addr',
      type: MixinsFormItemType.localized,
      isRequired: false,
      localizedVersion: 'v2',
      localizedObject: true,
      items: idValueFields(),
    },
    {
      name: 'attrs',
      key: 'attrs',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.object,
      isRequired: false,
      items: idValueFields(),
    },
    {
      name: 'obj',
      key: 'obj',
      type: MixinsFormItemType.object,
      isRequired: false,
      items: idValueFields('obj.'),
    },
  ]

  // Mirrors MixinsForm's toPayload in the default context.
  const save = (stored: Record<string, unknown>) => {
    const formData = convertToIdValuePair(stored)
    const filteredData = filterOutDeletedMixins(formData, items)
    const withDefaults = applyDefaultsOnEmptyFields(filteredData, items)
    return serializeLocalizedFields(convertFromIdValuePair(withDefaults), items)
  }

  it('saves the stored values unchanged', () => {
    const stored = {
      addr: { en: { id: 'A', value: 'B' }, de: null },
      attrs: [{ id: 'color', value: 'red' }],
      obj: { id: 'C', value: 'D' },
    }

    expect(save(stored)).toEqual(stored)
  })
})
