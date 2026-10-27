import { describe, expect, it } from 'vitest'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'
import {
  defaultValueForMixinItem,
  diffAddRemove,
  filterOutChangedMixins,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  fromLocalizedMap,
  getLocalizedSchemaVersion,
  isLocalizedLanguageValueRef,
  isLocalizedNullableRef,
  serializeLocalizedFields,
  toLocalizedMap,
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
