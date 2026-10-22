import type Localized from '../models/Localized.model'

export type LocalizedInput = Localized | string | undefined

/**
 * Converts all keys of a Localized object to lowercase.
 * For example: { en: 'test', 'de-AT': 'test2' } becomes { en: 'test', 'de-at': 'test2' }.
 * Returns string or undefined unchanged when input is not an object.
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
