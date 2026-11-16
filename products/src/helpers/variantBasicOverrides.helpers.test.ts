import { describe, expect, it } from 'vitest'
import {
  VARIANT_OVERRIDABLE_FIELDS,
  withVariantBasicOverrides,
} from './variantBasicOverrides.helpers'

describe('withVariantBasicOverrides', () => {
  it('keeps the own list when the plain read returned none (Scenario 1)', () => {
    const own = ['description', 'mixins.qa.note', 'metadata.mixins.qa']

    expect(withVariantBasicOverrides(own, ['name'])).toEqual([
      'description',
      'mixins.qa.note',
      'metadata.mixins.qa',
      'name',
    ])
  })

  it('adds only fields Product Service accepts as overrides (Scenario 2)', () => {
    expect(
      withVariantBasicOverrides(
        [],
        ['variantAttributes', 'description', 'code', 'template', 'mixins']
      )
    ).toEqual(['description'])
  })

  it('accepts every whitelisted basic field', () => {
    expect(
      withVariantBasicOverrides([], [...VARIANT_OVERRIDABLE_FIELDS])
    ).toEqual([...VARIANT_OVERRIDABLE_FIELDS])
  })

  it('lists each entry once (Scenario 2)', () => {
    expect(
      withVariantBasicOverrides(
        ['description', 'metadata.mixins.qa'],
        ['description', 'name', 'name']
      )
    ).toEqual(['description', 'metadata.mixins.qa', 'name'])
  })

  it('keeps entries of the own list as stored', () => {
    expect(
      withVariantBasicOverrides(['mixins.qa', 'metadata.mixins.qa'], [])
    ).toEqual(['mixins.qa', 'metadata.mixins.qa'])
  })

  it('does not mutate its inputs', () => {
    const own = ['description']
    const dirty = ['name', 'variantAttributes']

    withVariantBasicOverrides(own, dirty)

    expect(own).toEqual(['description'])
    expect(dirty).toEqual(['name', 'variantAttributes'])
  })
})
