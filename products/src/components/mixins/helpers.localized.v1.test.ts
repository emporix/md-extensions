import { describe, expect, it } from 'vitest'
import {
  convertFromIdValuePair,
  convertToIdValuePair,
  defaultValueForMixinItem,
  mapLocalizedMixinToLocalized,
  mapLocalizedToLocalizedMixins,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'

const LANGUAGE_VALUE_V1 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValue_v1.json'
const LANGUAGE_VALUE_NULLABLE_V1 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValueNullable_v1.json'
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

describe('mapMixinsPropertyToItemType v1 localized', () => {
  it('maps type array + languageValue_v1 items $ref to localized', () => {
    expect(
      mapMixinsPropertyToItemType(
        property({
          type: MixinsPropertyType.array,
          items: property({ $ref: LANGUAGE_VALUE_V1 }),
        })
      )
    ).toBe(MixinsFormItemType.localized)
  })

  it('maps type array + languageValueNullable_v1 items $ref to localized', () => {
    expect(
      mapMixinsPropertyToItemType(
        property({
          type: MixinsPropertyType.array,
          items: property({ $ref: LANGUAGE_VALUE_NULLABLE_V1 }),
        })
      )
    ).toBe(MixinsFormItemType.localized)
  })

  it('maps a non-localized $ref to object, not localized', () => {
    expect(
      mapMixinsPropertyToItemType(property({ $ref: OTHER_MIXIN_REF }))
    ).toBe(MixinsFormItemType.object)
  })
})

describe('mapMixinsPropertyToItemArrayType v1 localized', () => {
  it('does not treat a v1 localized TEXT field as an array of unknown', () => {
    expect(
      mapMixinsPropertyToItemArrayType(
        property({
          type: MixinsPropertyType.array,
          items: property({ $ref: LANGUAGE_VALUE_V1 }),
        })
      )
    ).toBeUndefined()
  })

  it('maps array-of-localized v1 (nested array + v1 $ref) to localized', () => {
    expect(
      mapMixinsPropertyToItemArrayType(
        property({
          type: MixinsPropertyType.array,
          items: property({
            type: MixinsPropertyType.array,
            items: property({ $ref: LANGUAGE_VALUE_V1 }),
          }),
        })
      )
    ).toBe(MixinsFormItemType.localized)
  })
})

describe('mapLocalizedMixinToLocalized / mapLocalizedToLocalizedMixins v1', () => {
  const mixins = [
    { language: 'en', value: 'Hello' },
    { language: 'de', value: 'Hallo' },
  ]
  const localized = { en: 'Hello', de: 'Hallo' }

  it('converts a v1 language/value array to a localized map', () => {
    expect(mapLocalizedMixinToLocalized(mixins)).toEqual(localized)
  })

  it('unwraps {id, value} wrappers before converting to a map', () => {
    expect(
      mapLocalizedMixinToLocalized([
        { id: 'a', value: { language: 'en', value: 'Hello' } },
        { id: 'b', value: { language: 'de', value: 'Hallo' } },
      ] as never)
    ).toEqual(localized)
  })

  it('converts a localized map back to a v1 language/value array', () => {
    expect(mapLocalizedToLocalizedMixins(localized)).toEqual(mixins)
  })

  it('roundtrips array → map → array', () => {
    expect(
      mapLocalizedToLocalizedMixins(mapLocalizedMixinToLocalized(mixins))
    ).toEqual(mixins)
  })
})

describe('defaultValueForMixinItem v1 localized', () => {
  it('defaults localized fields to an empty array', () => {
    const item: MixinsFormItem = {
      name: 'pieces',
      key: 'pieces',
      type: MixinsFormItemType.localized,
      isRequired: false,
    }
    expect(defaultValueForMixinItem(item)).toEqual([])
  })
})

describe('convertToIdValuePair / convertFromIdValuePair v1 localized', () => {
  it('roundtrips a mixin object whose localized field is a v1 array (not a map)', () => {
    const data = {
      pieces: [
        { language: 'en', value: 'Hello' },
        { language: 'de', value: 'Hallo' },
      ],
      title: 'plain',
    }

    const result = convertFromIdValuePair(convertToIdValuePair(data))

    expect(result.title).toBe('plain')
    expect(result.pieces).toEqual([
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ])
    expect(Array.isArray(result.pieces)).toBe(true)
  })
})
