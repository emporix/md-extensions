import Localized from '../models/Localized.model'
import { Reference, Schema, SchemaAttribute } from '../models/Schema.model'

export const MAX_MIXIN_BADGE_FIELDS = 3

export interface LocationMixinBadge {
  key: string
  name: string
  fields: string[]
  hasMore: boolean
}

/** Common shape of a type-level mixin definition (Schema or Reference). */
export type MixinSchemaSource = Pick<
  Schema | Reference,
  'id' | 'name' | 'attributes' | 'metadata'
>

const attributesOf = (source: MixinSchemaSource): SchemaAttribute[] =>
  source.attributes ?? []

/**
 * Maps a mixin schema/reference (from Schema Service, for the LOCATION type) to
 * a compact badge: name + up to MAX_MIXIN_BADGE_FIELDS attribute names, flagging
 * when more exist. `resolveLocalized` is injected so this stays pure/testable.
 *
 * `key` is the schema id — it matches `mixinsForms[].id` in the detail view, so a
 * badge can deep-link to its tab regardless of whether the record has saved
 * values for that mixin yet.
 */
export const mapSchemaToMixinBadge = (
  source: MixinSchemaSource,
  resolveLocalized: (value: Localized | string | undefined) => string
): LocationMixinBadge => {
  const attributes = attributesOf(source)
  return {
    key: source.id,
    name: resolveLocalized(source.name),
    fields: attributes
      .slice(0, MAX_MIXIN_BADGE_FIELDS)
      .map((attribute) => resolveLocalized(attribute.name)),
    hasMore: attributes.length > MAX_MIXIN_BADGE_FIELDS,
  }
}

export const mapSchemasToMixinBadges = (
  sources: MixinSchemaSource[],
  resolveLocalized: (value: Localized | string | undefined) => string
): LocationMixinBadge[] => {
  const seen = new Set<string>()
  const badges: LocationMixinBadge[] = []
  for (const source of sources) {
    const badge = mapSchemaToMixinBadge(source, resolveLocalized)
    if (seen.has(badge.key)) continue
    seen.add(badge.key)
    badges.push(badge)
  }
  return badges
}
