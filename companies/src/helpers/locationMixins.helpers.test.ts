import { describe, expect, it } from 'vitest'
import {
  LocationMixinBadge,
  mapSchemasToMixinBadges,
  mapSchemaToMixinBadge,
  MAX_MIXIN_BADGE_FIELDS,
  MixinSchemaSource,
} from './locationMixins.helpers'
import Localized from '../models/Localized.model'
import { SchemaAttribute } from '../models/Schema.model'

const resolve = (value?: Localized | string): string =>
  typeof value === 'string' ? value : ((value as Localized)?.en ?? '')

const attr = (name: string): SchemaAttribute =>
  ({ name: { en: name } }) as unknown as SchemaAttribute

const source = (overrides: Partial<MixinSchemaSource>): MixinSchemaSource =>
  ({
    id: 'schema-id',
    name: { en: 'Schema' },
    attributes: [],
    metadata: undefined,
    ...overrides,
  }) as MixinSchemaSource

describe('mapSchemaToMixinBadge', () => {
  it('keys the badge by schema id and resolves name and field names', () => {
    const badge = mapSchemaToMixinBadge(
      source({
        id: 'TEST2',
        name: { en: 'Geolocation' },
        attributes: [attr('Latitude'), attr('Longitude')],
      }),
      resolve
    )

    expect(badge).toEqual<LocationMixinBadge>({
      key: 'TEST2',
      name: 'Geolocation',
      fields: ['Latitude', 'Longitude'],
      hasMore: false,
    })
  })

  it('caps fields at MAX_MIXIN_BADGE_FIELDS and flags hasMore', () => {
    const attributes = Array.from(
      { length: MAX_MIXIN_BADGE_FIELDS + 2 },
      (_, i) => attr(`Field ${i + 1}`)
    )

    const badge = mapSchemaToMixinBadge(source({ attributes }), resolve)

    expect(badge.fields).toHaveLength(MAX_MIXIN_BADGE_FIELDS)
    expect(badge.fields).toEqual(['Field 1', 'Field 2', 'Field 3'])
    expect(badge.hasMore).toBe(true)
  })

  it('handles a schema without attributes', () => {
    const badge = mapSchemaToMixinBadge(
      source({ attributes: undefined }),
      resolve
    )

    expect(badge.fields).toEqual([])
    expect(badge.hasMore).toBe(false)
  })

  it('supports a plain string schema name', () => {
    const badge = mapSchemaToMixinBadge(source({ name: 'Plain name' }), resolve)

    expect(badge.name).toBe('Plain name')
  })
})

describe('mapSchemasToMixinBadges', () => {
  it('maps every schema', () => {
    const badges = mapSchemasToMixinBadges(
      [
        source({ id: 'a', name: { en: 'A' } }),
        source({ id: 'b', name: { en: 'B' } }),
      ],
      resolve
    )

    expect(badges.map((b) => b.name)).toEqual(['A', 'B'])
    expect(badges.map((b) => b.key)).toEqual(['a', 'b'])
  })

  it('dedupes schemas that resolve to the same key', () => {
    const badges = mapSchemasToMixinBadges(
      [
        source({ id: 'same', name: { en: 'A' } }),
        source({ id: 'same', name: { en: 'A duplicate' } }),
      ],
      resolve
    )

    expect(badges).toHaveLength(1)
    expect(badges[0].name).toBe('A')
  })

  it('returns an empty array for no schemas', () => {
    expect(mapSchemasToMixinBadges([], resolve)).toEqual([])
  })
})
