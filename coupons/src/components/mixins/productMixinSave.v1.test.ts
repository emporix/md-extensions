import { describe, expect, it } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  defaultValueForMixinItem,
  filterOutDeletedMixins,
  isNestedObjectMixinItem,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  getLocalizedSchemaVersion,
  serializeLocalizedFields,
} from './localizedMixin.helpers'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'

const LANGUAGE_VALUE_V1 =
  'https://res.cloudinary.com/saas-ag/raw/upload/v1691386216/schemata2/languageValue_v1.json'
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

const v1LocalizedTitleProperty = property({
  type: MixinsPropertyType.array,
  items: property({ $ref: LANGUAGE_VALUE_V1 }),
})

const v1ArrayOfLocalizedProperty = property({
  type: MixinsPropertyType.array,
  items: property({
    type: MixinsPropertyType.array,
    items: property({ $ref: LANGUAGE_VALUE_V1 }),
  }),
})

const titleItem = (): MixinsFormItem => ({
  name: 'title',
  key: 'title',
  type: MixinsFormItemType.localized,
  isRequired: false,
})

const skuItem = (): MixinsFormItem => ({
  name: 'sku',
  key: 'sku',
  type: MixinsFormItemType.text,
  isRequired: false,
})

const arrTextItem = (): MixinsFormItem => ({
  name: 'arrText',
  key: 'arrText',
  type: MixinsFormItemType.array,
  arrayType: MixinsFormItemType.localized,
  isRequired: false,
})

const unitPricingItem = (): MixinsFormItem => ({
  name: 'unitPricingMeasure',
  key: 'unitPricingMeasure',
  type: MixinsFormItemType.object,
  isRequired: false,
  items: [
    {
      name: 'value',
      key: 'unitPricingMeasure.value',
      type: MixinsFormItemType.decimal,
      isRequired: false,
    },
    {
      name: 'unitCode',
      key: 'unitPricingMeasure.unitCode',
      type: MixinsFormItemType.text,
      isRequired: false,
    },
  ],
})

const storedProductDetails = () => ({
  title: [
    { language: 'en', value: 'Hello' },
    { language: 'de', value: 'Hallo' },
  ],
  sku: 'ABC',
})

interface ProductMixinSaveResult {
  title: unknown
  sku: unknown
  arrText: unknown[][]
  unitPricingMeasure: unknown
}

const productMixinSave = (
  storedMixinData: Record<string, unknown>,
  items: MixinsFormItem[]
): ProductMixinSaveResult => {
  const formData = convertToIdValuePair(storedMixinData)
  const filteredData = filterOutDeletedMixins(formData, items)
  const result = applyDefaultsOnEmptyFields(filteredData, items)
  return serializeLocalizedFields(
    convertFromIdValuePair(result),
    items
  ) as ProductMixinSaveResult
}

describe('product mixin v1 PATCH shape (MixinsForm submit chain)', () => {
  const items = [titleItem(), skuItem()]

  it('maps a PRODUCT mixin languageValue_v1 field to localized v1', () => {
    expect(mapMixinsPropertyToItemType(v1LocalizedTitleProperty)).toBe(
      MixinsFormItemType.localized
    )
    expect(getLocalizedSchemaVersion(v1LocalizedTitleProperty)).toBe('v1')
  })

  it('defaults a localized field without localizedVersion to an empty array', () => {
    expect(defaultValueForMixinItem(titleItem())).toEqual([])
  })

  it('renders a v1 localized field as an input, not a nested object', () => {
    expect(isNestedObjectMixinItem(titleItem())).toBe(false)
  })

  it('saves title as a language/value array and leaves sku unchanged', () => {
    const saved = productMixinSave(storedProductDetails(), items)

    expect(saved.title).toEqual([
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ])
    expect(Array.isArray(saved.title)).toBe(true)
    expect(saved.sku).toBe('ABC')
    expect(saved.title).not.toEqual({ en: 'Hello', de: 'Hallo' })
  })

  it('roundtrips convertToIdValuePair / convertFromIdValuePair without turning title into a map', () => {
    const stored = storedProductDetails()
    const result = convertFromIdValuePair(convertToIdValuePair(stored))

    expect(result.sku).toBe('ABC')
    expect(Array.isArray(result.title)).toBe(true)
    expect(result.title).toEqual(stored.title)
  })
})

describe('product mixin v1 array-of-localized', () => {
  it('maps nested languageValue_v1 arrays to arrayType localized', () => {
    expect(mapMixinsPropertyToItemArrayType(v1ArrayOfLocalizedProperty)).toBe(
      MixinsFormItemType.localized
    )
  })

  it('serializes arrText as nested language/value arrays, not maps', () => {
    const stored = {
      arrText: [
        [
          { language: 'en', value: 'English Value' },
          { language: 'fr', value: '' },
        ],
      ],
    }

    const saved = productMixinSave(stored, [arrTextItem()])

    expect(saved.arrText).toEqual([
      [
        { language: 'en', value: 'English Value' },
        { language: 'fr', value: '' },
      ],
    ])
    expect(Array.isArray(saved.arrText[0])).toBe(true)
    expect(saved.arrText[0][0]).toEqual({
      language: 'en',
      value: 'English Value',
    })
  })

  it('keeps a null localized array element through the save chain', () => {
    const saved = productMixinSave(
      {
        arrText: [null, [{ language: 'en', value: 'English Value' }]],
      },
      [arrTextItem()]
    )

    expect(saved.arrText).toEqual([
      null,
      [{ language: 'en', value: 'English Value' }],
    ])
  })
})

describe('product mixin v1 non-localized objects', () => {
  it('does not treat a non-localized $ref as localized', () => {
    expect(
      mapMixinsPropertyToItemType(property({ $ref: OTHER_MIXIN_REF }))
    ).toBe(MixinsFormItemType.object)
    expect(
      getLocalizedSchemaVersion(property({ $ref: OTHER_MIXIN_REF }))
    ).toBeUndefined()
  })

  it('leaves unitPricingMeasure as a plain object on save', () => {
    const stored = {
      unitPricingMeasure: { value: 1.5, unitCode: 'KGM' },
      sku: 'ABC',
    }

    const saved = productMixinSave(stored, [unitPricingItem(), skuItem()])

    expect(saved.unitPricingMeasure).toEqual({ value: 1.5, unitCode: 'KGM' })
    expect(saved.sku).toBe('ABC')
  })
})

describe('product mixin v1 optional localized field', () => {
  it('does not invent an absent optional localized field as [] or {}', () => {
    expect(serializeLocalizedFields({}, [titleItem()])).toEqual({})
    expect(
      serializeLocalizedFields({ sku: 'ABC' }, [titleItem(), skuItem()])
    ).toEqual({ sku: 'ABC' })
  })
})
