import { describe, expect, it } from 'vitest'
import {
  getDecimalMaxFractionDigits,
  mapMixinsPropertyToItemType,
  MixinsFormItemType,
} from './helpers'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'

const property = (
  overrides: Partial<MixinsSchemaProperty>
): MixinsSchemaProperty =>
  ({
    type: MixinsPropertyType.number,
    description: '',
    items: undefined as unknown as MixinsSchemaProperty,
    options: {},
    ...overrides,
  }) as MixinsSchemaProperty

describe('getDecimalMaxFractionDigits', () => {
  it('derives fraction digits from multipleOf', () => {
    expect(getDecimalMaxFractionDigits(0.1)).toBe(1)
    expect(getDecimalMaxFractionDigits(0.01)).toBe(2)
    expect(getDecimalMaxFractionDigits(0.001)).toBe(3)
    expect(getDecimalMaxFractionDigits(0.0001)).toBe(4)
  })

  it('falls back when multipleOf is missing or invalid', () => {
    expect(getDecimalMaxFractionDigits(undefined)).toBe(10)
    expect(getDecimalMaxFractionDigits(-1)).toBe(10)
    expect(getDecimalMaxFractionDigits(0)).toBe(10)
  })
})

describe('mapMixinsPropertyToItemType decimal mapping', () => {
  it('maps number with any multipleOf to decimal', () => {
    expect(mapMixinsPropertyToItemType(property({ multipleOf: 0.1 }))).toBe(
      MixinsFormItemType.decimal
    )
    expect(mapMixinsPropertyToItemType(property({ multipleOf: 0.001 }))).toBe(
      MixinsFormItemType.decimal
    )
  })

  it('maps number without multipleOf to decimal', () => {
    expect(mapMixinsPropertyToItemType(property({}))).toBe(
      MixinsFormItemType.decimal
    )
  })

  it('maps integer to integer', () => {
    expect(
      mapMixinsPropertyToItemType(
        property({ type: MixinsPropertyType.integer })
      )
    ).toBe(MixinsFormItemType.integer)
  })
})
