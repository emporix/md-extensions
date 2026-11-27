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
