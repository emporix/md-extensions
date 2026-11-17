import { describe, expect, it } from 'vitest'
import {
  diffAddRemove,
  filterOutChangedMixins,
  filterOutDeletedMixins,
  convertToIdValuePair,
  convertFromIdValuePair,
  namesEqual,
  resolveMixinNames,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { SchemaAttribute } from '../../models/Schema.model'

// Builds the item tree the way useMixinsForm.getMixinsItems does: children of
// an array-of-objects get BARE keys (rootKey = ''), so a nested attribute and a
// top-level attribute can share the same key.
const leaf = (key: string): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.text,
  isRequired: false,
})

const arrayOfObjects = (
  key: string,
  children: MixinsFormItem[]
): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.array,
  arrayType: MixinsFormItemType.object,
  isRequired: false,
  items: children,
})

// getMixinsItems prefixes object-nested children with the parent's local key
// (`parent.child`), unlike array children which stay bare. Children here carry
// their already-prefixed key, mirroring that format.
const objectOf = (key: string, children: MixinsFormItem[]): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.object,
  isRequired: false,
  items: children,
})

// Mirrors cfg_product v7 -> v8: v8 drops the top-level salesUnit/deliveryPlant
// but keeps salesOrgConfig[].salesUnit / salesOrgConfig[].deliveryPlant.
const buildItems = (withTopSalesFields: boolean): MixinsFormItem[] => {
  const items: MixinsFormItem[] = [
    arrayOfObjects('salesOrgConfig', [
      leaf('deliveryPlant'),
      leaf('salesOrg'),
      leaf('salesUnit'),
    ]),
  ]
  if (withTopSalesFields) {
    items.push(leaf('deliveryPlant'), leaf('salesUnit'))
  }
  return items
}

const productData = () => ({
  salesUnit: 'top-su',
  deliveryPlant: 'top-dp',
  salesOrgConfig: [
    { deliveryPlant: 'p1', salesOrg: 'o1', salesUnit: 'u1' },
    { deliveryPlant: 'p2', salesOrg: 'o2', salesUnit: 'u2' },
  ],
})

describe('COP-5948 mixins schema-upgrade field filtering', () => {
  it('deletes only the top-level attribute, preserving nested same-named values (raw data)', () => {
    const items = diffAddRemove(buildItems(true), buildItems(false))

    const result = filterOutDeletedMixins(productData(), items)

    expect(result.salesUnit).toBeUndefined()
    expect(result.deliveryPlant).toBeUndefined()
    expect(result.salesOrgConfig).toEqual([
      { deliveryPlant: 'p1', salesOrg: 'o1', salesUnit: 'u1' },
      { deliveryPlant: 'p2', salesOrg: 'o2', salesUnit: 'u2' },
    ])
  })

  it('preserves nested values through the id/value-pair submit round-trip', () => {
    const items = diffAddRemove(buildItems(true), buildItems(false))
    const formData = convertToIdValuePair(productData())

    const saved = convertFromIdValuePair(
      filterOutDeletedMixins(formData, items)
    )

    expect(saved.salesUnit).toBeUndefined()
    expect(saved.deliveryPlant).toBeUndefined()
    expect(saved.salesOrgConfig).toEqual([
      { deliveryPlant: 'p1', salesOrg: 'o1', salesUnit: 'u1' },
      { deliveryPlant: 'p2', salesOrg: 'o2', salesUnit: 'u2' },
    ])
  })

  it('strips a changed top-level attribute on render but keeps the nested same-named value', () => {
    // Present: top-level salesUnit is text; Newer: same key but different type
    // (marked toChange). Nested salesOrgConfig[].salesUnit is unchanged.
    const present = buildItems(true)
    const newer: MixinsFormItem[] = [
      arrayOfObjects('salesOrgConfig', [
        leaf('deliveryPlant'),
        leaf('salesOrg'),
        leaf('salesUnit'),
      ]),
      leaf('deliveryPlant'),
      { ...leaf('salesUnit'), type: MixinsFormItemType.integer },
    ]
    const items = diffAddRemove(present, newer)

    const result = filterOutChangedMixins(productData(), items)

    expect(result.salesUnit).toBeUndefined()
    expect(result.salesOrgConfig).toEqual([
      { deliveryPlant: 'p1', salesOrg: 'o1', salesUnit: 'u1' },
      { deliveryPlant: 'p2', salesOrg: 'o2', salesUnit: 'u2' },
    ])
  })

  it('removes a genuinely deleted nested attribute without touching the top-level one', () => {
    // Newer schema keeps top-level salesUnit but drops salesOrgConfig[].salesUnit.
    const present = buildItems(true)
    const newer: MixinsFormItem[] = [
      arrayOfObjects('salesOrgConfig', [
        leaf('deliveryPlant'),
        leaf('salesOrg'),
      ]),
      leaf('deliveryPlant'),
      leaf('salesUnit'),
    ]
    const items = diffAddRemove(present, newer)

    const result = filterOutDeletedMixins(productData(), items)

    expect(result.salesUnit).toBe('top-su')
    expect(result.salesOrgConfig).toEqual([
      { deliveryPlant: 'p1', salesOrg: 'o1' },
      { deliveryPlant: 'p2', salesOrg: 'o2' },
    ])
  })

  it('does not mark nested items as changed/deleted when only a top-level attribute is removed', () => {
    const items = diffAddRemove(buildItems(true), buildItems(false))
    const salesOrgConfig = items.find((i) => i.key === 'salesOrgConfig')

    expect(
      items
        .filter((i) => i.toDelete)
        .map((i) => i.key)
        .sort()
    ).toEqual(['deliveryPlant', 'salesUnit'])
    expect(
      salesOrgConfig?.items?.every((i) => !i.toDelete && !i.toChange)
    ).toBe(true)
  })

  it('flags a display-name-only change as nameChanged (badge) but not toChange, and never strips the value', () => {
    const present: MixinsFormItem[] = [
      { ...leaf('salesUnit'), name: { en: 'Sales Unit' } },
    ]
    const newer: MixinsFormItem[] = [
      { ...leaf('salesUnit'), name: { en: 'Sales Unit (renamed)' } },
    ]

    const items = diffAddRemove(present, newer)
    const salesUnit = items.find((i) => i.key === 'salesUnit')

    expect(salesUnit?.nameChanged).toBe(true)
    expect(salesUnit?.toChange).toBeUndefined()

    // nameChanged must not participate in value stripping
    const data = { salesUnit: 'v' }
    expect(filterOutChangedMixins(data, items).salesUnit).toBe('v')
  })

  it('drops an id/value-pair wrapper element that empties out under removeEmpty instead of leaking { value: undefined }', () => {
    // Nested salesOrgConfig[].salesUnit marked as changed -> its path is in the
    // removeEmpty (render) removal set. Given id/value-pair shaped data whose
    // element only holds that field, the whole element must be filtered out.
    const items: MixinsFormItem[] = [
      {
        ...arrayOfObjects('salesOrgConfig', [
          { ...leaf('salesUnit'), toChange: true },
        ]),
      },
    ]
    const data = {
      salesOrgConfig: [{ id: 'a', value: { salesUnit: 'u1' } }],
    }

    const result = filterOutChangedMixins(data, items)

    expect(result.salesOrgConfig).toEqual([])
  })

  it('scopes removal by path for object-nested (non-array) same-named attributes', () => {
    const present: MixinsFormItem[] = [
      objectOf('config', [{ ...leaf('salesUnit'), key: 'config.salesUnit' }]),
      leaf('salesUnit'),
    ]
    const newer: MixinsFormItem[] = [
      objectOf('config', [{ ...leaf('salesUnit'), key: 'config.salesUnit' }]),
    ]
    const items = diffAddRemove(present, newer)

    const data = { salesUnit: 'top', config: { salesUnit: 'nested' } }
    const result = filterOutDeletedMixins(data, items)

    expect(result.salesUnit).toBeUndefined()
    expect(result.config).toEqual({ salesUnit: 'nested' })
  })

  it('scopes removal by path across deep (3-level) nesting', () => {
    const deep = (): MixinsFormItem[] => [
      objectOf('config', [
        objectOf('config.sub', [
          { ...leaf('salesUnit'), key: 'sub.salesUnit' },
        ]),
      ]),
    ]
    const present: MixinsFormItem[] = [...deep(), leaf('salesUnit')]
    const newer: MixinsFormItem[] = deep()
    const items = diffAddRemove(present, newer)

    const data = {
      salesUnit: 'top',
      config: { sub: { salesUnit: 'deep' } },
    }
    const result = filterOutDeletedMixins(data, items)

    expect(result.salesUnit).toBeUndefined()
    expect(result.config).toEqual({ sub: { salesUnit: 'deep' } })
  })

  it('still flags a genuine structural change (type) as changed', () => {
    const present: MixinsFormItem[] = [leaf('salesUnit')]
    const newer: MixinsFormItem[] = [
      { ...leaf('salesUnit'), type: MixinsFormItemType.integer },
    ]

    const items = diffAddRemove(present, newer)

    expect(items.find((i) => i.key === 'salesUnit')?.toChange).toBe(true)
  })
})

describe('resolveMixinNames (path-aware label resolution)', () => {
  const attr = (
    key: string,
    name: string,
    extra: Partial<SchemaAttribute> = {}
  ): SchemaAttribute =>
    ({ key, name: { en: name }, ...extra }) as SchemaAttribute

  it('keys array-nested labels by full path, not by bare attribute name', () => {
    const attributes: SchemaAttribute[] = [
      attr('salesOrgConfig', 'Sales Org Config (array)', {
        arrayType: {
          type: 'OBJECT',
          localized: false,
          values: [],
          attributes: [attr('salesUnit', 'Nested Sales Unit')],
        },
      } as Partial<SchemaAttribute>),
      attr('salesUnit', 'Top Sales Unit'),
    ]

    const names = resolveMixinNames(attributes)

    // The nested attribute gets its OWN label under its full path, and the
    // top-level label does not overwrite it (no bare-key collision).
    expect(names['salesUnit']).toEqual({ en: 'Top Sales Unit' })
    expect(names['salesOrgConfig.salesUnit']).toEqual({
      en: 'Nested Sales Unit',
    })
  })

  it('keys object-nested labels by full path', () => {
    const attributes: SchemaAttribute[] = [
      attr('config', 'Config', {
        attributes: [attr('salesUnit', 'Nested Sales Unit')],
      }),
      attr('salesUnit', 'Top Sales Unit'),
    ]

    const names = resolveMixinNames(attributes)

    expect(names['config.salesUnit']).toEqual({ en: 'Nested Sales Unit' })
    expect(names['salesUnit']).toEqual({ en: 'Top Sales Unit' })
  })

  it('returns an empty map for undefined attributes', () => {
    expect(resolveMixinNames(undefined)).toEqual({})
  })
})

describe('namesEqual', () => {
  it('treats equal localized labels as equal regardless of key order', () => {
    expect(namesEqual({ en: 'A', de: 'B' }, { de: 'B', en: 'A' })).toBe(true)
  })

  it('detects a changed locale value', () => {
    expect(namesEqual({ en: 'A' }, { en: 'B' })).toBe(false)
  })

  it('detects an added/removed locale', () => {
    expect(namesEqual({ en: 'A' }, { en: 'A', de: 'B' })).toBe(false)
  })

  it('handles string vs object and undefined', () => {
    expect(namesEqual('A', 'A')).toBe(true)
    expect(namesEqual('A', { en: 'A' })).toBe(false)
    expect(namesEqual(undefined, undefined)).toBe(true)
  })
})
