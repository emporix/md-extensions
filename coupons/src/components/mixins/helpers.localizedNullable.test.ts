import { describe, expect, it } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  createForm,
  defaultValueForMixinItem,
  isMixinFieldNullable,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { serializeLocalizedFields } from './localizedMixin.helpers'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'

// The schema service generates nullable localized TEXT as an array whose items
// reference languageValueNullable_v1: each language's value may be null, the
// attribute itself may not.
const LANGUAGE_VALUE_NULLABLE_V1 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValueNullable_v1.json'
const LANGUAGE_VALUE_NULLABLE_V2 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValueNullable_v2.json'

const property = (
  overrides: Partial<MixinsSchemaProperty>
): MixinsSchemaProperty =>
  ({
    description: '',
    options: {},
    ...overrides,
  }) as MixinsSchemaProperty

const nullableV1Property = property({
  type: MixinsPropertyType.array,
  items: property({ $ref: LANGUAGE_VALUE_NULLABLE_V1 }),
})
const nullableV2Property = property({ $ref: LANGUAGE_VALUE_NULLABLE_V2 })

const localizedItem = (version: 'v1' | 'v2'): MixinsFormItem => ({
  name: 'locNull',
  key: 'locNull',
  type: MixinsFormItemType.localized,
  isRequired: false,
  isNullable: false,
  localizedVersion: version,
})

/** The default (non site-aware) MixinsForm save path. */
const savePayload = (
  formValues: Record<string, unknown>,
  items: MixinsFormItem[]
) =>
  serializeLocalizedFields(
    convertFromIdValuePair(
      applyDefaultsOnEmptyFields(convertToIdValuePair(formValues), items)
    ),
    items
  )

describe('isMixinFieldNullable', () => {
  it('does not make a nullable v1 localized TEXT field nullable', () => {
    expect(
      isMixinFieldNullable(
        nullableV1Property,
        mapMixinsPropertyToItemType(nullableV1Property)
      )
    ).toBe(false)
  })

  it('does not make a nullable v2 localized TEXT field nullable', () => {
    expect(
      isMixinFieldNullable(
        nullableV2Property,
        mapMixinsPropertyToItemType(nullableV2Property)
      )
    ).toBe(false)
  })

  it('keeps null in the type list and nullable enums nullable', () => {
    expect(
      isMixinFieldNullable(
        property({
          type: [MixinsPropertyType.string, MixinsPropertyType.null],
        }),
        MixinsFormItemType.text
      )
    ).toBe(true)
    expect(
      isMixinFieldNullable(
        property({ enum: ['A', null] }),
        MixinsFormItemType.enum
      )
    ).toBe(true)
  })
})

describe.each(['v1', 'v2'] as const)(
  'nullable %s localized save',
  (version) => {
    const items = [localizedItem(version)]

    it('leaves an untouched field unset and out of the payload', () => {
      const form = createForm(items)

      expect(form.locNull).toBeUndefined()
      expect(savePayload(form, items)).toEqual({})
    })

    it('sends an empty value, never null, when the field was cleared', () => {
      const cleared = version === 'v1' ? [] : {}

      expect(savePayload({ locNull: cleared }, items)).toEqual({
        locNull: cleared,
      })
    })

    it('still starts a new array entry with an empty value', () => {
      const arrayItem: MixinsFormItem = {
        ...localizedItem(version),
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.localized,
      }

      expect(defaultValueForMixinItem(arrayItem, true)).toEqual(
        version === 'v1' ? [] : {}
      )
    })
  }
)
