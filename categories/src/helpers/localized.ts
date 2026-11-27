import type Localized from '../models/Localized.model'

export type LocalizedInput = Localized | string | null | undefined

/**
 * Converts all keys of a Localized object to lowercase.
 * For example: { en: 'test', 'de-AT': 'test2' } becomes { en: 'test', 'de-at': 'test2' }.
 * Returns string, null, or undefined unchanged when input is not an object.
 */
export function localizedKeysToLowerCase(
  input: LocalizedInput
): LocalizedInput {
  if (input === undefined || input === null) {
    return input
  }
  if (typeof input === 'string') {
    return input
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.toLowerCase(), value])
  ) as Localized
}

/**
 * Case-insensitive lookup of a localized entry by language code (MD
 * `findLocalizedEntry`, COP-6374).
 *
 * Language codes are matched ignoring case, so a `de-AT` content language
 * resolves a `de-at` key and vice versa. The stored value and its original
 * key casing are returned unchanged.
 *
 * Returns undefined when the input is not an object or no key matches.
 */
export function findLocalizedEntry(
  input: LocalizedInput,
  lang: string
): [string, string] | undefined {
  if (input === undefined || input === null || typeof input === 'string') {
    return undefined
  }
  const target = lang.toLowerCase()
  return Object.entries(input).find(([key]) => key.toLowerCase() === target)
}

/** True when at least one language has non-blank text (MD `hasLocalizedValue`). */
export const hasLocalizedValue = (value?: Localized): boolean =>
  Object.values(value ?? {}).some((text) => text.trim() !== '')

/** Localized map columns a list can sort by. */
const LOCALIZED_SORT_FIELDS = ['localizedName', 'localizedSlug']

/** `de-at` → `de-AT`; a code `Intl` rejects is kept as it is. */
const canonicalLanguage = (lang: string): string => {
  try {
    return Intl.getCanonicalLocales(lang)[0] ?? lang
  } catch {
    return lang
  }
}

/**
 * The list query with a localized sort field narrowed to the content language
 * (COP-7332). The Category Service does not order by a whole localized map
 * (`sort=localizedName:ASC`), only by one language (`localizedName.de-AT`),
 * and that path is case-sensitive while the service stores BCP-47 keys; the
 * host passes the content language as the tenant configuration spells it
 * (`de-at`). Any other query is returned as it is, so it stays the same object.
 */
export const withLocalizedSort = <T extends { sortField?: string | null }>(
  query: T,
  contentLanguage: string | undefined
): T => {
  const { sortField } = query
  if (
    !sortField ||
    !contentLanguage ||
    !LOCALIZED_SORT_FIELDS.includes(sortField)
  ) {
    return query
  }
  return {
    ...query,
    sortField: `${sortField}.${canonicalLanguage(contentLanguage)}`,
  }
}
