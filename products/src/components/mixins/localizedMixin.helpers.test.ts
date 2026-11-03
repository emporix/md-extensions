import { describe, expect, it } from 'vitest'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'
import {
  defaultValueForMixinItem,
  diffAddRemove,
  filterOutChangedMixins,
  hasLocalizedContent,
  hasMissingRequiredMixinValues,
  hasMissingRequiredSiteOverlayValues,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  fromLocalizedMap,
  getLocalizedArrayItemVersion,
  getLocalizedObjectValue,
  getLocalizedSchemaVersion,
  isLocalizedLanguageValueRef,
  isLocalizedNullableRef,
  isLocalizedObjectProperty,
  LOCALIZED_LANGUAGE_KEY_PATTERN,
  serializeLocalizedFields,
  setLocalizedObjectValue,
  toLocalizedMap,
  toLocalizedValueMap,
} from './localizedMixin.helpers'

const LANGUAGE_VALUE_V1 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValue_v1.json'
const LANGUAGE_VALUE_V2 =
  'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/testtenant/languageValue_v2.json'
const LANGUAGE_VALUE_NULLABLE_V2 =
  'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/testtenant/languageValueNullable_v2.json'
const OTHER_MIXIN_REF =
  'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/testtenant/otherMixin_v1.json'

const property = (
  overrides: Partial<MixinsSchemaProperty>
): MixinsSchemaProperty =>
  ({
    description: '',
    options: {},
    ...overrides,
  }) as MixinsSchemaProperty

const localizedItem = (
  version: 'v1' | 'v2',
  key = 'pieces'
): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.localized,
  isRequired: false,
  localizedVersion: version,
})

describe('languageValue $ref detection', () => {
  it('recognizes v1 and v2 languageValue filenames, including nullable', () => {
    expect(isLocalizedLanguageValueRef(LANGUAGE_VALUE_V1)).toBe(true)
    expect(isLocalizedLanguageValueRef(LANGUAGE_VALUE_V2)).toBe(true)
    expect(isLocalizedLanguageValueRef(LANGUAGE_VALUE_NULLABLE_V2)).toBe(true)
    expect(isLocalizedLanguageValueRef(OTHER_MIXIN_REF)).toBe(false)
  })

  it('does not treat languageValueNullable_v2 as the non-nullable v2 filename', () => {
    expect(LANGUAGE_VALUE_NULLABLE_V2.endsWith('/languageValue_v2.json')).toBe(
      false
    )
    expect(isLocalizedNullableRef(LANGUAGE_VALUE_NULLABLE_V2)).toBe(true)
    expect(isLocalizedNullableRef(LANGUAGE_VALUE_V2)).toBe(false)
  })
})

describe('getLocalizedSchemaVersion', () => {
  it('detects a tenant-path v2 $ref as v2', () => {
    expect(
      getLocalizedSchemaVersion(property({ $ref: LANGUAGE_VALUE_V2 }))
    ).toBe('v2')
  })

  it('detects a nullable v2 $ref as v2', () => {
    expect(
      getLocalizedSchemaVersion(property({ $ref: LANGUAGE_VALUE_NULLABLE_V2 }))
    ).toBe('v2')
  })

  it('does not treat array + items.$ref v2 as localized TEXT', () => {
    const notText = property({
      type: MixinsPropertyType.array,
      items: property({ $ref: LANGUAGE_VALUE_V2 }),
    })
    expect(getLocalizedSchemaVersion(notText)).toBeUndefined()
    expect(mapMixinsPropertyToItemType(notText)).toBe(MixinsFormItemType.array)
  })

  it('detects v1 localized arrays when type is a union with null first', () => {
    expect(
      getLocalizedSchemaVersion(
        property({
          type: [MixinsPropertyType.null, MixinsPropertyType.array],
          items: property({ $ref: LANGUAGE_VALUE_V1 }),
        })
      )
    ).toBe('v1')
  })
})

describe('mapMixinsPropertyToItemType / ArrayType v2', () => {
  it('maps a v2 property $ref to localized', () => {
    expect(
      mapMixinsPropertyToItemType(property({ $ref: LANGUAGE_VALUE_V2 }))
    ).toBe(MixinsFormItemType.localized)
  })

  it('does not treat a v2 localized object as an array of items', () => {
    expect(
      mapMixinsPropertyToItemArrayType(property({ $ref: LANGUAGE_VALUE_V2 }))
    ).toBeUndefined()
  })

  it('maps a nullable v2 TEXT $ref to localized, not an array of maps', () => {
    const nullableV2 = property({ $ref: LANGUAGE_VALUE_NULLABLE_V2 })
    expect(mapMixinsPropertyToItemType(nullableV2)).toBe(
      MixinsFormItemType.localized
    )
    expect(mapMixinsPropertyToItemArrayType(nullableV2)).toBeUndefined()
  })

  it('maps a nullable v1 TEXT union to localized, not an array of elements', () => {
    const nullableV1 = property({
      type: [MixinsPropertyType.null, MixinsPropertyType.array],
      items: property({ $ref: LANGUAGE_VALUE_V1 }),
    })
    expect(mapMixinsPropertyToItemType(nullableV1)).toBe(
      MixinsFormItemType.localized
    )
    expect(mapMixinsPropertyToItemArrayType(nullableV1)).toBeUndefined()
  })

  it('still maps a non-localized $ref to object', () => {
    expect(
      mapMixinsPropertyToItemType(property({ $ref: OTHER_MIXIN_REF }))
    ).toBe(MixinsFormItemType.object)
  })
})

describe('toLocalizedMap / fromLocalizedMap', () => {
  it('passes a v2 map through for display', () => {
    expect(toLocalizedMap({ en: 'Hello', de: 'Hallo' })).toEqual({
      en: 'Hello',
      de: 'Hallo',
    })
  })

  it('returns an empty object for null or undefined', () => {
    expect(toLocalizedMap(null)).toEqual({})
    expect(toLocalizedMap(undefined)).toEqual({})
  })

  it('emits a v2 map and a v1 array from the same localized object', () => {
    const map = { en: 'Hello', de: 'Hallo' }
    expect(fromLocalizedMap(map, 'v2')).toEqual(map)
    expect(fromLocalizedMap(map, 'v1')).toEqual([
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ])
  })
})

describe('serializeLocalizedFields', () => {
  const v1Stored = {
    pieces: [
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ],
  }

  it('keeps v1 arrays when the schema is v1', () => {
    expect(serializeLocalizedFields(v1Stored, [localizedItem('v1')])).toEqual(
      v1Stored
    )
  })

  it('emits v2 maps even when stored data is still a v1 array', () => {
    expect(serializeLocalizedFields(v1Stored, [localizedItem('v2')])).toEqual({
      pieces: { en: 'Hello', de: 'Hallo' },
    })
  })

  it('does not mutate the input', () => {
    const original = JSON.parse(JSON.stringify(v1Stored))
    serializeLocalizedFields(v1Stored, [localizedItem('v2')])
    expect(v1Stored).toEqual(original)
  })

  it('does not introduce absent optional localized fields', () => {
    expect(serializeLocalizedFields({}, [localizedItem('v1')])).toEqual({})
    expect(serializeLocalizedFields({}, [localizedItem('v2')])).toEqual({})
    expect(
      serializeLocalizedFields({ other: 'kept' }, [localizedItem('v2')])
    ).toEqual({ other: 'kept' })
  })

  it('preserves null for nullable localized fields', () => {
    expect(
      serializeLocalizedFields({ pieces: null }, [localizedItem('v1')])
    ).toEqual({ pieces: null })
    expect(
      serializeLocalizedFields({ pieces: null }, [localizedItem('v2')])
    ).toEqual({ pieces: null })
  })

  it('preserves null elements inside a v1 array of localized values', () => {
    const data = {
      titles: [null, [{ language: 'en', value: 'A' }]],
    }
    const arrayItem: MixinsFormItem = {
      name: 'titles',
      key: 'titles',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
      isRequired: false,
      localizedVersion: 'v1',
    }

    expect(serializeLocalizedFields(data, [arrayItem])).toEqual({
      titles: [null, [{ language: 'en', value: 'A' }]],
    })
  })
})

describe('defaultValueForMixinItem v2 localized', () => {
  it('defaults v2 localized fields to an empty object', () => {
    expect(defaultValueForMixinItem(localizedItem('v2'))).toEqual({})
  })
})

describe('diffAddRemove localizedVersion', () => {
  const v1TextProperty = property({
    type: MixinsPropertyType.array,
    items: property({ $ref: LANGUAGE_VALUE_V1 }),
  })
  const v2TextProperty = property({ $ref: LANGUAGE_VALUE_V2 })

  const formItemFromProperty = (
    key: string,
    schemaProperty: MixinsSchemaProperty,
    version: 'v1' | 'v2',
    type: MixinsFormItemType
  ): MixinsFormItem => ({
    name: key,
    key,
    type,
    arrayType: mapMixinsPropertyToItemArrayType(schemaProperty),
    isRequired: false,
    localizedVersion: version,
  })

  it('does not mark a v1 to v2 serialization change as toChange', () => {
    const present: MixinsFormItem[] = [localizedItem('v1')]
    const newer: MixinsFormItem[] = [localizedItem('v2')]
    const items = diffAddRemove(present, newer)
    expect(items.find((i) => i.key === 'pieces')?.toChange).toBeUndefined()
  })

  it('does not mark a mapped v1 TEXT field upgrade to v2 as toChange', () => {
    const present = [
      formItemFromProperty(
        'pieces',
        v1TextProperty,
        'v1',
        MixinsFormItemType.localized
      ),
    ]
    const newer = [
      formItemFromProperty(
        'pieces',
        v2TextProperty,
        'v2',
        MixinsFormItemType.localized
      ),
    ]
    const items = diffAddRemove(present, newer)
    expect(items.find((i) => i.key === 'pieces')?.toChange).toBeUndefined()
    expect(
      filterOutChangedMixins(
        {
          pieces: [
            { language: 'en', value: 'Hello' },
            { language: 'de', value: 'Hallo' },
          ],
        },
        items
      ).pieces
    ).toEqual([
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ])
  })
})

const localizedObjectProperty = (nullable = false): MixinsSchemaProperty => {
  const valueType = nullable
    ? [MixinsPropertyType.object, MixinsPropertyType.null]
    : MixinsPropertyType.object
  return property({
    type: valueType,
    patternProperties: {
      [LOCALIZED_LANGUAGE_KEY_PATTERN]: property({
        type: valueType,
        properties: { city: property({ type: MixinsPropertyType.string }) },
      }),
    },
  })
}

const localizedObjectItem = (
  overrides: Partial<MixinsFormItem> = {}
): MixinsFormItem => ({
  name: 'addr',
  key: 'addr',
  type: MixinsFormItemType.localized,
  isRequired: false,
  localizedVersion: 'v2',
  localizedObject: true,
  ...overrides,
})

describe('v2 localized OBJECT schema detection (B1)', () => {
  it('detects a patternProperties language map as a v2 localized OBJECT', () => {
    expect(isLocalizedObjectProperty(localizedObjectProperty())).toBe(true)
    expect(getLocalizedSchemaVersion(localizedObjectProperty())).toBe('v2')
    expect(mapMixinsPropertyToItemType(localizedObjectProperty())).toBe(
      MixinsFormItemType.localized
    )
    expect(
      mapMixinsPropertyToItemArrayType(localizedObjectProperty())
    ).toBeUndefined()
  })

  it('detects a nullable localized OBJECT', () => {
    expect(isLocalizedObjectProperty(localizedObjectProperty(true))).toBe(true)
    expect(mapMixinsPropertyToItemType(localizedObjectProperty(true))).toBe(
      MixinsFormItemType.localized
    )
  })

  it('does not treat a plain object or unrelated patternProperties as localized', () => {
    const plain = property({
      type: MixinsPropertyType.object,
      properties: { city: property({ type: MixinsPropertyType.string }) },
    })
    const otherPattern = property({
      type: MixinsPropertyType.object,
      patternProperties: { '^x-': property({}) },
    })
    expect(isLocalizedObjectProperty(plain)).toBe(false)
    expect(isLocalizedObjectProperty(otherPattern)).toBe(false)
    expect(mapMixinsPropertyToItemType(plain)).toBe(MixinsFormItemType.object)
  })
})

describe('v2 array of localized values schema detection (B2, B3)', () => {
  it('maps an array of languageValue_v2 items to an array of localized', () => {
    const arrayOfText = property({
      type: MixinsPropertyType.array,
      items: property({ $ref: LANGUAGE_VALUE_V2 }),
    })
    expect(mapMixinsPropertyToItemType(arrayOfText)).toBe(
      MixinsFormItemType.array
    )
    expect(mapMixinsPropertyToItemArrayType(arrayOfText)).toBe(
      MixinsFormItemType.localized
    )
    expect(getLocalizedArrayItemVersion(arrayOfText)).toBe('v2')
  })

  it('maps an array of localized OBJECT maps to an array of localized', () => {
    const arrayOfObjects = property({
      type: MixinsPropertyType.array,
      items: localizedObjectProperty(),
    })
    expect(mapMixinsPropertyToItemType(arrayOfObjects)).toBe(
      MixinsFormItemType.array
    )
    expect(mapMixinsPropertyToItemArrayType(arrayOfObjects)).toBe(
      MixinsFormItemType.localized
    )
    expect(getLocalizedArrayItemVersion(arrayOfObjects)).toBe('v2')
  })

  it('keeps an array of plain objects as an array of objects', () => {
    const plainObjects = property({
      type: MixinsPropertyType.array,
      items: property({
        type: MixinsPropertyType.object,
        properties: { city: property({ type: MixinsPropertyType.string }) },
      }),
    })
    expect(mapMixinsPropertyToItemArrayType(plainObjects)).toBe(
      MixinsFormItemType.object
    )
    expect(getLocalizedArrayItemVersion(plainObjects)).toBeUndefined()
  })
})

describe('toLocalizedValueMap', () => {
  it('keeps object values and null entries for localized OBJECT maps', () => {
    expect(
      toLocalizedValueMap(
        { en: { city: 'Berlin' }, de: null, fr: 'ignored' },
        'object'
      )
    ).toEqual({ en: { city: 'Berlin' }, de: null })
  })

  it('keeps scalar values and null entries for localized TEXT maps', () => {
    expect(
      toLocalizedValueMap({ en: 'Hello', de: null, fr: 5, es: {} }, 'text')
    ).toEqual({ en: 'Hello', de: null, fr: 5 })
  })

  it('converts a v1 array to a map for TEXT and ignores it for OBJECT', () => {
    const v1 = [{ language: 'en', value: 'Hello' }]
    expect(toLocalizedValueMap(v1)).toEqual({ en: 'Hello' })
    expect(toLocalizedValueMap(v1, 'object')).toEqual({})
  })

  it('returns an empty map for null or undefined', () => {
    expect(toLocalizedValueMap(null, 'object')).toEqual({})
    expect(toLocalizedValueMap(undefined)).toEqual({})
  })
})

describe('localized OBJECT value access', () => {
  const value = { en: { city: 'Berlin', geo: { lat: 1 } }, de: null }

  it('reads nested values per language', () => {
    expect(getLocalizedObjectValue(value, 'en', ['city'])).toBe('Berlin')
    expect(getLocalizedObjectValue(value, 'en', ['geo', 'lat'])).toBe(1)
    expect(getLocalizedObjectValue(value, 'de', ['city'])).toBeUndefined()
    expect(getLocalizedObjectValue(undefined, 'en', ['city'])).toBeUndefined()
  })

  it('sets values immutably, preserving other languages and null entries', () => {
    const next = setLocalizedObjectValue(value, 'en', ['geo', 'lng'], 2)
    expect(next).toEqual({
      en: { city: 'Berlin', geo: { lat: 1, lng: 2 } },
      de: null,
    })
    expect(value.en.geo).toEqual({ lat: 1 })
  })

  it('creates the language object when the entry is missing or null', () => {
    expect(setLocalizedObjectValue(value, 'de', ['city'], 'Berlin').de).toEqual(
      { city: 'Berlin' }
    )
    expect(setLocalizedObjectValue(null, 'en', ['city'], 'Rome')).toEqual({
      en: { city: 'Rome' },
    })
  })
})

describe('hasLocalizedContent for localized OBJECT', () => {
  it('is true when a language has at least one field', () => {
    expect(hasLocalizedContent({ en: { city: 'Berlin' } })).toBe(true)
  })

  it('is false for empty maps, empty language objects and null entries', () => {
    expect(hasLocalizedContent({})).toBe(false)
    expect(hasLocalizedContent({ en: {} })).toBe(false)
    expect(hasLocalizedContent({ en: null })).toBe(false)
  })

  it('is false when nested values are blank, true for non-blank or falsy scalars', () => {
    expect(hasLocalizedContent({ en: { city: '' } })).toBe(false)
    expect(hasLocalizedContent({ en: { city: '   ', geo: {} } })).toBe(false)
    expect(hasLocalizedContent({ en: { geo: { lat: 0 } } })).toBe(true)
    expect(hasLocalizedContent({ en: { flag: false } })).toBe(true)
  })
})

describe('required children of a localized OBJECT', () => {
  const addrItem = (isRequired: boolean): MixinsFormItem => ({
    ...localizedObjectItem(),
    isRequired,
    items: [
      {
        key: 'city',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: true,
      },
      {
        key: 'zip',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: false,
      },
    ],
  })

  it('flags a present language object missing a required child, even when the field is optional', () => {
    const items = [addrItem(false)]
    expect(
      hasMissingRequiredMixinValues({ addr: { en: { zip: '1' } } }, items)
    ).toBe(true)
    expect(
      hasMissingRequiredMixinValues({ addr: { en: { city: '' } } }, items)
    ).toBe(true)
    // Sparse site overlay may omit required children that inherit from default.
    expect(
      hasMissingRequiredSiteOverlayValues({ addr: { en: { zip: '1' } } }, items)
    ).toBe(false)
  })

  it('validates each element of an array of localized OBJECTs, wrapped or plain', () => {
    const items: MixinsFormItem[] = [
      {
        ...addrItem(false),
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.localized,
      },
    ]
    expect(
      hasMissingRequiredMixinValues({ addr: [{ en: { zip: '1' } }] }, items)
    ).toBe(true)
    expect(
      hasMissingRequiredMixinValues(
        { addr: [{ id: 'a', value: { en: { zip: '1' } } }] },
        items
      )
    ).toBe(true)
    expect(
      hasMissingRequiredSiteOverlayValues(
        { addr: [{ en: { zip: '1' } }] },
        items
      )
    ).toBe(true)
    expect(
      hasMissingRequiredMixinValues(
        { addr: [{ en: { city: 'Berlin' } }, { de: null }] },
        items
      )
    ).toBe(false)
    expect(hasMissingRequiredMixinValues({ addr: [] }, items)).toBe(false)
  })

  it('accepts complete, absent and per-language null values for an optional field', () => {
    const items = [addrItem(false)]
    expect(
      hasMissingRequiredMixinValues({ addr: { en: { city: 'Berlin' } } }, items)
    ).toBe(false)
    expect(hasMissingRequiredMixinValues({}, items)).toBe(false)
    expect(
      hasMissingRequiredMixinValues(
        { addr: { en: null, de: { city: 'Berlin' } } },
        items
      )
    ).toBe(false)
  })
})

describe('serializeLocalizedFields for v2 localized OBJECT / arrays (B1-B4)', () => {
  it('B1 keeps a localized OBJECT map untouched', () => {
    const data = {
      addr: { en: { city: 'Berlin', zip: '10115' }, de: { city: 'Berlin' } },
    }
    expect(serializeLocalizedFields(data, [localizedObjectItem()])).toEqual(
      data
    )
  })

  it('B2 keeps an array of localized TEXT maps and null elements', () => {
    const data = { tags: [{ en: 'A', de: 'B' }, null, { en: 'C' }] }
    const arrayItem: MixinsFormItem = {
      name: 'tags',
      key: 'tags',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
      isRequired: false,
      localizedVersion: 'v2',
    }
    expect(serializeLocalizedFields(data, [arrayItem])).toEqual(data)
  })

  it('B3 keeps an array of localized OBJECT maps', () => {
    const data = {
      addrs: [{ en: { city: 'Berlin' } }, { de: { city: 'Bonn' } }],
    }
    const arrayItem = localizedObjectItem({
      name: 'addrs',
      key: 'addrs',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
    })
    expect(serializeLocalizedFields(data, [arrayItem])).toEqual(data)
  })

  it('B4 preserves null per-language entries and null fields', () => {
    const objectData = { addr: { en: null, de: { city: 'Bonn' } } }
    expect(
      serializeLocalizedFields(objectData, [localizedObjectItem()])
    ).toEqual(objectData)
    expect(
      serializeLocalizedFields({ addr: null }, [localizedObjectItem()])
    ).toEqual({ addr: null })

    const textData = { pieces: { en: 'Hello', de: null } }
    expect(serializeLocalizedFields(textData, [localizedItem('v2')])).toEqual(
      textData
    )
  })

  it('B4 preserves null elements in an array of localized OBJECT maps', () => {
    const data = { addrs: [null, { en: null }] }
    const arrayItem = localizedObjectItem({
      key: 'addrs',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
    })
    expect(serializeLocalizedFields(data, [arrayItem])).toEqual(data)
  })

  it('serializes a localized OBJECT nested under a plain object', () => {
    const data = { shipping: { addr: { en: { city: 'Berlin' }, de: null } } }
    const plain: MixinsFormItem = {
      name: 'shipping',
      key: 'shipping',
      type: MixinsFormItemType.object,
      isRequired: false,
      items: [localizedObjectItem({ key: 'shipping.addr' })],
    }
    expect(serializeLocalizedFields(data, [plain])).toEqual(data)
  })

  it('does not mutate the input', () => {
    const data = { addr: { en: { city: 'Berlin' } } }
    const copy = JSON.parse(JSON.stringify(data))
    serializeLocalizedFields(data, [localizedObjectItem()])
    expect(data).toEqual(copy)
  })
})
