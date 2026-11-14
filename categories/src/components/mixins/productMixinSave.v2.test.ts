import { describe, expect, it } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  defaultValueForMixinItem,
  filterOutDeletedMixins,
  isNestedObjectMixinItem,
  mapMixinsPropertyToItemType,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  getLocalizedSchemaVersion,
  serializeLocalizedFields,
} from './localizedMixin.helpers'
import { MixinsSchemaProperty } from '../../models/Mixins.model'

const LANGUAGE_VALUE_V2 =
  'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/testtenant/languageValue_v2.json'

const property = (
  overrides: Partial<MixinsSchemaProperty>
): MixinsSchemaProperty =>
  ({
    description: '',
    options: {},
    ...overrides,
  }) as MixinsSchemaProperty

const v2TitleProperty = property({ $ref: LANGUAGE_VALUE_V2 })

const titleItem = (items?: MixinsFormItem[]): MixinsFormItem => ({
  name: 'title',
  key: 'title',
  type: MixinsFormItemType.localized,
  isRequired: false,
  localizedVersion: 'v2',
  items,
})

const skuItem = (): MixinsFormItem => ({
  name: 'sku',
  key: 'sku',
  type: MixinsFormItemType.text,
  isRequired: false,
})

interface ProductMixinSaveResult {
  title: unknown
  sku: unknown
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

describe('product mixin v2 mapping', () => {
  it('maps a PRODUCT mixin languageValue_v2 $ref to localized v2', () => {
    expect(mapMixinsPropertyToItemType(v2TitleProperty)).toBe(
      MixinsFormItemType.localized
    )
    expect(getLocalizedSchemaVersion(v2TitleProperty)).toBe('v2')
  })

  it('defaults a v2 localized field to an empty object', () => {
    expect(defaultValueForMixinItem(titleItem())).toEqual({})
  })

  it('treats localized items with an empty items array as a field, not a nested object', () => {
    expect(isNestedObjectMixinItem(titleItem([]))).toBe(false)
    expect(isNestedObjectMixinItem(titleItem())).toBe(false)
    expect(
      isNestedObjectMixinItem({
        name: 'unitPricingMeasure',
        key: 'unitPricingMeasure',
        type: MixinsFormItemType.object,
        isRequired: false,
        items: [],
      })
    ).toBe(true)
  })
})

describe('product mixin v2 PATCH shape (MixinsForm submit chain)', () => {
  const items = [titleItem(), skuItem()]

  it('saves title as a language map and leaves sku unchanged', () => {
    const saved = productMixinSave(
      {
        title: { en: 'Hello', de: 'Hallo' },
        sku: 'ABC',
      },
      items
    )

    expect(saved.title).toEqual({ en: 'Hello', de: 'Hallo' })
    expect(Array.isArray(saved.title)).toBe(false)
    expect(saved.sku).toBe('ABC')
  })

  it('serializes stored v1 arrays to a v2 map when the schema is v2', () => {
    const saved = productMixinSave(
      {
        title: [
          { language: 'en', value: 'Hello' },
          { language: 'de', value: 'Hallo' },
        ],
        sku: 'ABC',
      },
      items
    )

    expect(saved.title).toEqual({ en: 'Hello', de: 'Hallo' })
    expect(saved.sku).toBe('ABC')
  })
})
