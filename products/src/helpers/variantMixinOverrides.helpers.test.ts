import { describe, expect, it } from 'vitest'
import {
  changedMixinPaths,
  withVariantMixinOverrides,
} from './variantMixinOverrides.helpers'
import { Product, ProductType } from '../models/Category.model'
import { Mixins } from '../models/Mixins.model'
import { MixinsFormMetadata } from '../components/mixins/helpers'
import { deepClone } from './utils'

const KEY = 'variant_attributes'
const URL = 'https://res.cloudinary.com/schemata/variant_attributes_v1.json'

const meta = (
  overrides: Partial<MixinsFormMetadata> = {}
): MixinsFormMetadata => ({
  key: KEY,
  url: URL,
  version: 1,
  ...overrides,
})

/** PUT body as `saveMixin` builds it: loaded product with the saved mixin applied. */
const payloadFor = (
  loadedMixins: Mixins,
  saved: Mixins,
  overridden?: string[],
  productType: ProductType = ProductType.variant
): Partial<Product> => ({
  id: 'parent--red',
  productType,
  parentVariantId: 'parent',
  mixins: { ...loadedMixins, ...saved },
  metadata: { mixins: { [KEY]: URL }, overridden },
})

const save = (
  loadedMixins: Mixins,
  data: Mixins,
  overridden?: string[],
  metadata: MixinsFormMetadata = meta()
) =>
  withVariantMixinOverrides(
    payloadFor(
      loadedMixins,
      metadata.siteAwareBatch ? data : { [KEY]: data },
      overridden
    ),
    loadedMixins,
    data,
    metadata
  )

describe('withVariantMixinOverrides', () => {
  const inherited = { [KEY]: { articleNumber: 'A-1', color: 'red' } }

  it('lists the changed inherited field and the schema binding (Scenario 1)', () => {
    const result = save(inherited, { articleNumber: 'A-2', color: 'red' })

    expect(result.metadata?.overridden).toEqual([
      `mixins.${KEY}.articleNumber`,
      `metadata.mixins.${KEY}`,
    ])
    expect(result.mixins?.[KEY]).toEqual({ articleNumber: 'A-2', color: 'red' })
    expect(result.metadata?.mixins).toEqual({ [KEY]: URL })
  })

  it('lists a field filled where variant and parent had none (Scenario 2)', () => {
    const result = save({}, { articleNumber: 'A-3' })

    expect(result.metadata?.overridden).toEqual([
      `mixins.${KEY}.articleNumber`,
      `metadata.mixins.${KEY}`,
    ])
    expect(result.mixins?.[KEY]).toEqual({ articleNumber: 'A-3' })
  })

  it('does not list fields the save left unchanged (Scenario 3)', () => {
    const result = save(inherited, { articleNumber: 'A-1', color: 'blue' })

    expect(result.metadata?.overridden).toContain(`mixins.${KEY}.color`)
    expect(result.metadata?.overridden).not.toContain(
      `mixins.${KEY}.articleNumber`
    )
  })

  describe('clearing a field inherits it again (Scenario 4)', () => {
    it('adds no path for a field emptied to an empty string and drops it', () => {
      const result = save(inherited, { articleNumber: '', color: 'red' })

      expect(result.metadata?.overridden).toEqual([`metadata.mixins.${KEY}`])
      expect(result.mixins?.[KEY]).toEqual({ color: 'red' })
    })

    it('adds no path for a null or removed field', () => {
      const nulled = save(inherited, { articleNumber: null, color: 'red' })
      const removed = save(inherited, { color: 'red' })

      expect(nulled.metadata?.overridden).toEqual([`metadata.mixins.${KEY}`])
      expect(removed.metadata?.overridden).toEqual([`metadata.mixins.${KEY}`])
    })

    it('drops a cleared field that the variant overrode before', () => {
      const overridden = [`mixins.${KEY}.articleNumber`]
      const result = save(
        { [KEY]: { articleNumber: 'OWN' } },
        { articleNumber: '' },
        overridden
      )

      expect(result.mixins?.[KEY]).toEqual({})
      expect(result.metadata?.overridden).toEqual([
        `mixins.${KEY}.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
    })

    it('drops a nested object whose fields were all cleared', () => {
      const result = save(
        { [KEY]: { size: { width: 10, unit: 'cm' } } },
        { size: { width: '', unit: '' } }
      )

      expect(result.mixins?.[KEY]).toEqual({})
      expect(result.metadata?.overridden).toEqual([`metadata.mixins.${KEY}`])
    })

    it('adds no path for a site overlay removed in a site-aware save', () => {
      const result = save(
        { [`${KEY}__main`]: { articleNumber: 'M-1' } },
        { [KEY]: { articleNumber: 'A-1' }, [`${KEY}__main`]: null },
        undefined,
        meta({ siteAwareBatch: true })
      )

      expect(result.metadata?.overridden).toEqual([
        `mixins.${KEY}.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
    })
  })

  describe('site-specific values (Scenario 5)', () => {
    it('lists the site storage key of a site-aware batch save', () => {
      const result = save(
        inherited,
        { [`${KEY}__main`]: { articleNumber: 'S-1' } },
        undefined,
        meta({ siteAwareBatch: true })
      )

      expect(result.metadata?.overridden).toEqual([
        `mixins.${KEY}__main.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
      expect(result.mixins?.[`${KEY}__main`]).toEqual({ articleNumber: 'S-1' })
    })

    it('uses the site storage key for a single-site save', () => {
      const data = { articleNumber: 'S-2' }
      const result = withVariantMixinOverrides(
        payloadFor(inherited, { [`${KEY}__main`]: data }),
        inherited,
        data,
        meta({ siteCode: 'main' })
      )

      expect(result.metadata?.overridden).toEqual([
        `mixins.${KEY}__main.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
    })
  })

  describe('earlier overrides survive (Scenario 6)', () => {
    it('keeps existing entries first and in order', () => {
      const result = save(inherited, { articleNumber: 'A-2', color: 'red' }, [
        'name',
        'mixins.other.code',
      ])

      expect(result.metadata?.overridden).toEqual([
        'name',
        'mixins.other.code',
        `mixins.${KEY}.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
    })

    it('lists each path once when the same field is saved again', () => {
      const first = save(inherited, { articleNumber: 'A-2', color: 'red' })
      const second = save(
        { [KEY]: { articleNumber: 'A-2', color: 'red' } },
        { articleNumber: 'A-3', color: 'red' },
        first.metadata?.overridden
      )

      expect(second.metadata?.overridden).toEqual([
        `mixins.${KEY}.articleNumber`,
        `metadata.mixins.${KEY}`,
      ])
    })
  })

  it.each([
    ProductType.basic,
    ProductType.bundle,
    ProductType.parentVariant,
    ProductType.dynamicVariant,
  ])('returns the %s payload unchanged (Scenario 7)', (productType) => {
    const data = { articleNumber: '' }
    const payload = payloadFor(
      inherited,
      { [KEY]: data },
      ['name'],
      productType
    )

    expect(withVariantMixinOverrides(payload, inherited, data, meta())).toBe(
      payload
    )
  })

  it('never lists paths for productVariantAttributes (Requirement 9)', () => {
    const data = { color: 'blue' }
    const payload = payloadFor(
      { productVariantAttributes: { color: 'red' } },
      { productVariantAttributes: data }
    )

    const result = withVariantMixinOverrides(
      payload,
      { productVariantAttributes: { color: 'red' } },
      data,
      meta({ key: 'productVariantAttributes' })
    )

    expect(result).toBe(payload)
  })

  it('does not mutate its inputs', () => {
    const loaded = deepClone(inherited)
    const data = { articleNumber: '', color: 'blue' }
    const payload = payloadFor(loaded, { [KEY]: data }, ['name'])
    const before = deepClone({ loaded, data, payload })

    withVariantMixinOverrides(payload, loaded, data, meta())

    expect({ loaded, data, payload }).toEqual(before)
  })
})

describe('changedMixinPaths (Requirement 8)', () => {
  const base = 'mixins.attrs'

  it('names a changed nested object field by its full path', () => {
    expect(
      changedMixinPaths(
        { size: { width: 10, unit: 'cm' } },
        { size: { width: 12, unit: 'cm' } },
        base
      )
    ).toEqual([`${base}.size.width`])
  })

  it('overrides an array as a whole', () => {
    expect(
      changedMixinPaths({ tags: ['a', 'b'] }, { tags: ['a', 'c'] }, base)
    ).toEqual([`${base}.tags`])
  })

  it('keeps an emptied array as a change', () => {
    expect(changedMixinPaths({ tags: ['a'] }, { tags: [] }, base)).toEqual([
      `${base}.tags`,
    ])
  })

  it('ignores key order inside array items', () => {
    expect(
      changedMixinPaths(
        { rows: [{ id: '1', value: 'x' }] },
        { rows: [{ value: 'x', id: '1' }] },
        base
      )
    ).toEqual([])
  })

  it('names a changed localized value per language', () => {
    expect(
      changedMixinPaths(
        { title: { en: 'Shirt', de: 'Hemd' } },
        { title: { en: 'Shirt', de: 'Oberhemd' } },
        base
      )
    ).toEqual([`${base}.title.de`])
  })

  it('names a changed localized v1 array as a whole', () => {
    expect(
      changedMixinPaths(
        { title: [{ language: 'en', value: 'Shirt' }] },
        { title: [{ language: 'en', value: 'Top' }] },
        base
      )
    ).toEqual([`${base}.title`])
  })

  it('adds no path for an empty object', () => {
    expect(
      changedMixinPaths({ size: { width: 1 } }, { size: {} }, base)
    ).toEqual([])
  })

  it('lists a value that changed type', () => {
    expect(
      changedMixinPaths({ size: 'large' }, { size: { width: 1 } }, base)
    ).toEqual([`${base}.size.width`])
  })
})
