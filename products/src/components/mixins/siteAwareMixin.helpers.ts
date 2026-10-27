import { deepClone, isEmptyObject } from '../../helpers/utils'
import { Mixins } from '../../models/Mixins.model'
import {
  filterOutChangedMixins,
  filterOutDeletedMixins,
  isSiteOverlayKey,
  MixinsFormItem,
  MixinsFormMetadata,
  mixinStorageKey,
  siteCodeFromStorageKey,
} from './helpers'
import { serializeLocalizedFields } from './localizedMixin.helpers'

export type SiteAwareDraftBag = Record<string, Mixins>

/**
 * Form-only map of array field paths → whether the site overlay explicitly
 * overrides inheritance. useFieldArray materializes omitted arrays as `[]`, so
 * this flag distinguishes “no override” from an intentional empty array.
 *
 * Leading `$` keeps this out of schema attribute keys (MD KeyFilter is `[\w-]`,
 * schema-service Pattern rejects punctuation-leading keys). Always stripped
 * before save via `applySiteArrayOverrideFlags` / `stripUndefinedLeaves`.
 */
export const SITE_ARRAY_OVERRIDE_FLAGS_KEY = '$__emporixSiteArrayOverrides'

/**
 * Merges mixin save payloads into the entity mixins map.
 * For site-aware batches, `null` deletes the storage key (full PUT replacement).
 */
export const applyMixinSaveData = (
  current: Mixins | undefined,
  data: Mixins,
  mixinMetadata: MixinsFormMetadata
): Mixins => {
  const next = { ...(current ?? {}) }
  if (mixinMetadata.siteAwareBatch) {
    Object.entries(data).forEach(([storageKey, payload]) => {
      if (payload == null) {
        delete next[storageKey]
      } else {
        next[storageKey] = payload
      }
    })
    return next
  }
  const storageKey = mixinStorageKey(mixinMetadata.key, mixinMetadata.siteCode)
  next[storageKey] = data
  return next
}

const stableSerialize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }
  if (typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableSerialize(
            (value as Record<string, unknown>)[key]
          )}`
      )
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value) ?? String(value)
}

/** Order-insensitive for objects; array order is preserved. */
export const areMixinsEqual = (
  left: Mixins | undefined,
  right: Mixins | undefined
): boolean => {
  return stableSerialize(left ?? {}) === stableSerialize(right ?? {})
}

/** Removes `undefined` leaves so sparse form payloads compare equal to API baselines. */
export const stripUndefinedLeaves = (payload: Mixins | undefined): Mixins => {
  const prune = (value: unknown): unknown => {
    if (value === undefined) {
      return undefined
    }
    if (Array.isArray(value)) {
      return value
        .map((entry) => prune(entry))
        .filter((entry) => entry !== undefined)
    }
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      Object.entries(value as Record<string, unknown>).forEach(
        ([key, entry]) => {
          if (key === SITE_ARRAY_OVERRIDE_FLAGS_KEY) {
            return
          }
          const pruned = prune(entry)
          if (pruned !== undefined) {
            out[key] = pruned
          }
        }
      )
      return out
    }
    return value
  }
  const pruned = prune(payload ?? {})
  if (pruned && typeof pruned === 'object' && !Array.isArray(pruned)) {
    return pruned as Mixins
  }
  return {}
}

const deleteAtPath = (obj: Record<string, unknown>, path: string): void => {
  const keys = path.split('.')
  let cursor: Record<string, unknown> | undefined = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const next = cursor?.[keys[i]]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      return
    }
    cursor = next as Record<string, unknown>
  }
  if (cursor) {
    delete cursor[keys[keys.length - 1]]
  }
}

/** Drops array paths flagged as not overridden, then removes the flags map. */
export const applySiteArrayOverrideFlags = (overlay: Mixins): Mixins => {
  const flags = overlay[SITE_ARRAY_OVERRIDE_FLAGS_KEY]
  const next: Mixins = deepClone(overlay)
  delete next[SITE_ARRAY_OVERRIDE_FLAGS_KEY]
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
    return next
  }
  Object.entries(flags as Record<string, unknown>).forEach(
    ([path, isOverride]) => {
      if (isOverride) {
        return
      }
      deleteAtPath(next as Record<string, unknown>, path)
    }
  )
  return next
}

const isExactV1LocalizedEntry = (record: Record<string, unknown>): boolean => {
  const keys = Object.keys(record)
  return (
    keys.length === 2 &&
    typeof record.language === 'string' &&
    Object.prototype.hasOwnProperty.call(record, 'value')
  )
}

/**
 * Strips empty values from a site overlay so form defaults are not treated as real data.
 * Keeps 0 / false / explicit empty arrays; drops null, '', and empty objects (recursively).
 * Empty arrays are valid overrides (e.g. clear default tags); clear inheritance via null/absence.
 */
export const normalizeSiteOverlay = (overlay: Mixins | undefined): Mixins => {
  const prune = (value: unknown): unknown => {
    if (value === null || value === undefined || value === '') {
      return undefined
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return []
      }
      // Keep ordinary object rows (even if fields prune empty) so validation still
      // sees the slot. Only drop fully-empty v1 localized translation entries.
      return value
        .map((entry) => {
          const pruned = prune(entry)
          if (pruned !== undefined) {
            return pruned
          }
          if (
            entry &&
            typeof entry === 'object' &&
            !Array.isArray(entry) &&
            isExactV1LocalizedEntry(entry as Record<string, unknown>)
          ) {
            return undefined
          }
          if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
            return {}
          }
          return undefined
        })
        .filter((entry) => entry !== undefined)
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      // Cleared references leave type-only stubs; drop them so inheritance resumes.
      if (
        'emporixReferenceType' in record &&
        (record.id === undefined || record.id === null || record.id === '')
      ) {
        return undefined
      }
      // Exact v1 localized shape only — do not strip extra properties from
      // ordinary objects that happen to include language/value keys.
      if (isExactV1LocalizedEntry(record)) {
        const prunedValue = prune(record.value)
        if (prunedValue === undefined) {
          return undefined
        }
        return { language: record.language, value: prunedValue }
      }
      const out: Record<string, unknown> = {}
      Object.entries(record).forEach(([key, entry]) => {
        const pruned = prune(entry)
        if (pruned !== undefined) {
          out[key] = pruned
        }
      })
      return Object.keys(out).length > 0 ? out : undefined
    }
    return value
  }

  const pruned = prune(applySiteArrayOverrideFlags(overlay ?? {}))
  if (pruned && typeof pruned === 'object' && !Array.isArray(pruned)) {
    return pruned as Mixins
  }
  return {}
}

/** Merges in-progress form payload for the active context into the draft bag. */
export const mergeLiveContext = (
  drafts: SiteAwareDraftBag,
  storageKey: string,
  live: Mixins | null | undefined
): SiteAwareDraftBag => {
  if (live == null) {
    return drafts
  }
  if (areMixinsEqual(drafts[storageKey], live)) {
    return drafts
  }
  return { ...drafts, [storageKey]: deepClone(live) }
}

export const seedSiteAwareDrafts = (
  schemaId: string,
  entityMixins: Mixins | undefined,
  knownSchemaIds?: ReadonlySet<string> | readonly string[]
): SiteAwareDraftBag => {
  const known =
    knownSchemaIds instanceof Set
      ? knownSchemaIds
      : knownSchemaIds
        ? new Set(knownSchemaIds)
        : undefined
  const drafts: SiteAwareDraftBag = {
    [schemaId]: deepClone(entityMixins?.[schemaId] ?? {}),
  }
  if (!entityMixins) {
    return drafts
  }
  Object.keys(entityMixins).forEach((key) => {
    // Real mixin schemas may contain `__` in their id (e.g. color__main). Skip
    // keys that are themselves registered schemas so they are not treated as
    // site overlays for a shorter prefix schema (color + site main).
    if (known?.has(key) && key !== schemaId) {
      return
    }
    if (isSiteOverlayKey(schemaId, key)) {
      drafts[key] = deepClone(entityMixins[key] ?? {})
    }
  })
  return drafts
}

export const listSiteCodesWithOverlay = (
  schemaId: string,
  drafts: SiteAwareDraftBag
): string[] => {
  return Object.keys(drafts)
    .map((key) => siteCodeFromStorageKey(schemaId, key))
    .filter((code): code is string => !!code)
    .filter((code) => {
      const overlay = drafts[mixinStorageKey(schemaId, code)]
      return overlay != null && !isEmptyObject(overlay)
    })
}

export const isDraftDirty = (
  schemaId: string,
  drafts: SiteAwareDraftBag,
  baseline: SiteAwareDraftBag
): boolean => {
  const keys = new Set([...Object.keys(drafts), ...Object.keys(baseline)])
  for (const key of keys) {
    if (!key.startsWith(schemaId)) {
      continue
    }
    if (key !== schemaId && !isSiteOverlayKey(schemaId, key)) {
      continue
    }
    if (!areMixinsEqual(drafts[key], baseline[key])) {
      return true
    }
  }
  return false
}

export const isContextDirty = (
  storageKey: string,
  drafts: SiteAwareDraftBag,
  baseline: SiteAwareDraftBag
): boolean => {
  return !areMixinsEqual(drafts[storageKey], baseline[storageKey])
}

/**
 * Applies schema-version field filtering to stored contexts for a mixin.
 * Unvisited overlays never pass through MixinsForm editing, so both changed and
 * deleted fields are stripped there. Prepared/edited contexts (tracked via
 * `preparedKeys`, not payload equality) only strip deleted fields — equality
 * alone is unsafe when a re-entered replacement matches the baseline value.
 */
export const migrateSiteAwareDraftsForSchema = (
  schemaId: string,
  drafts: SiteAwareDraftBag,
  baseline: SiteAwareDraftBag,
  items: MixinsFormItem[],
  preparedKeys?: ReadonlySet<string>
): SiteAwareDraftBag => {
  const next: SiteAwareDraftBag = { ...drafts }
  Object.keys(drafts).forEach((key) => {
    if (key !== schemaId && !isSiteOverlayKey(schemaId, key)) {
      return
    }
    const raw = drafts[key] ?? {}
    const prepared = preparedKeys?.has(key) === true
    const untouched = !prepared && areMixinsEqual(raw, baseline[key])
    const filtered = untouched
      ? (filterOutDeletedMixins(
          filterOutChangedMixins(raw, items) ?? {},
          items
        ) ?? {})
      : (filterOutDeletedMixins(raw, items) ?? {})
    // Unvisited overlays skip the form's serializeLocalizedFields path; apply it
    // here so v1→v2 localized storage is rewritten before the schema URL advances.
    const serialized = serializeLocalizedFields(filtered, items) as Mixins
    next[key] =
      key === schemaId
        ? stripUndefinedLeaves(serialized)
        : normalizeSiteOverlay(serialized)
  })
  return next
}

/**
 * Builds the mixins patch for a site-aware save: every dirty storage key,
 * with empty site overlays represented as null so callers can delete them.
 */
export const buildSiteAwareSavePatch = (
  schemaId: string,
  drafts: SiteAwareDraftBag,
  baseline: SiteAwareDraftBag
): Mixins => {
  const patch: Mixins = {}
  const keys = new Set([...Object.keys(drafts), ...Object.keys(baseline)])
  keys.forEach((key) => {
    if (key !== schemaId && !isSiteOverlayKey(schemaId, key)) {
      return
    }
    const next = drafts[key] ?? {}
    const prev = baseline[key] ?? {}
    if (areMixinsEqual(next, prev)) {
      return
    }
    if (key === schemaId) {
      patch[key] = deepClone(next)
      return
    }
    if (isEmptyObject(next)) {
      patch[key] = null
      return
    }
    patch[key] = deepClone(next)
  })
  return patch
}

/** True when the entity has no metadata.mixins binding for this schema yet. */
export const needsInitialSiteAwareBinding = (
  schemaId: string,
  knownSchemaIds?: ReadonlySet<string> | readonly string[]
): boolean => {
  if (!schemaId) {
    return false
  }
  const known =
    knownSchemaIds instanceof Set
      ? knownSchemaIds
      : new Set(knownSchemaIds ?? [])
  return !known.has(schemaId)
}

/**
 * First attach of an optional-only schema needs an empty default payload so
 * onSave can write metadata.mixins[schemaId] even when draft === baseline {}.
 */
export const ensureInitialBindingPatch = (
  schemaId: string,
  patch: Mixins,
  needsInitialBinding: boolean
): Mixins => {
  if (!needsInitialBinding || !schemaId) {
    return patch
  }
  if (Object.prototype.hasOwnProperty.call(patch, schemaId)) {
    return patch
  }
  return { ...patch, [schemaId]: {} }
}

export const formatInheritedDisplayValue = (
  value: unknown
): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return undefined
    }
    if (
      value.every(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          'language' in entry &&
          'value' in entry
      )
    ) {
      return value
        .map((entry) => `${entry.language}: ${entry.value ?? ''}`)
        .join(', ')
    }
    return value
      .map((entry) => formatInheritedDisplayValue(entry) ?? '')
      .filter((entry) => entry !== '')
      .join(', ')
  }
  if (typeof value === 'object') {
    if (
      'id' in (value as Record<string, unknown>) &&
      (value as { id?: unknown }).id
    ) {
      return String((value as { id: unknown }).id)
    }
    const localized = value as Record<string, unknown>
    const parts = Object.entries(localized)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([lang, v]) => `${lang}: ${String(v)}`)
    return parts.length ? parts.join(', ') : undefined
  }
  return undefined
}
