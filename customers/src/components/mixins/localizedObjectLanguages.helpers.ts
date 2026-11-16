import {
  hasLocalizedContent,
  hasLocalizedObjectInput,
  hasMissingRequiredMixinValues,
  hasNonBlankValue,
  hasMissingRequiredSiteOverlayValues,
  isNestedObjectMixinItem,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  getLocalizedObjectValue,
  setLocalizedObjectValue,
  toLocalizedValueMap,
  type LocalizedValueMap,
} from './localizedMixin.helpers'

const leafKey = (key: string): string => key.split('.').pop() ?? key

/**
 * Language tab order of a localized OBJECT: the content language first, then
 * the configured languages, then languages that exist only in stored values.
 * The selected language stays listed, so clearing its last value does not
 * switch the tab, and the focused field, to another language.
 */
export const orderLocalizedLanguages = (
  configuredLanguageIds: readonly string[],
  values: readonly unknown[],
  contentLanguage?: string | null,
  selectedLanguage?: string
): string[] => {
  const ids: string[] = []
  const add = (id: string) => {
    if (id && !ids.includes(id)) {
      ids.push(id)
    }
  }
  configuredLanguageIds.forEach(add)
  values.forEach((value) =>
    Object.keys(toLocalizedValueMap(value, 'object')).forEach(add)
  )
  if (selectedLanguage) {
    add(selectedLanguage)
  }
  if (!contentLanguage || !ids.includes(contentLanguage)) {
    return ids
  }
  return [contentLanguage, ...ids.filter((id) => id !== contentLanguage)]
}

const isBlank = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '')

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const unsetBlankPath = (
  node: Record<string, unknown>,
  path: readonly string[]
): Record<string, unknown> => {
  const [head, ...rest] = path
  if (head === undefined) {
    return node
  }
  if (rest.length === 0) {
    if (!isBlank(node[head])) {
      return node
    }
    const next = { ...node }
    delete next[head]
    return next
  }
  const child = node[head]
  if (!isPlainObject(child)) {
    return node
  }
  const nextChild = unsetBlankPath(child, rest)
  if (nextChild === child) {
    return node
  }
  const next = { ...node }
  if (Object.keys(nextChild).length === 0) {
    delete next[head]
  } else {
    next[head] = nextChild
  }
  return next
}

/**
 * Drops the edited field when it is blank (in a site overlay it then inherits
 * again), then the parents and the language it leaves empty. An emptied
 * language becomes `null` when `asNull` is set. Other fields and languages,
 * including values the form cannot edit, stay as stored.
 */
export const pruneEditedField = (
  map: LocalizedValueMap,
  language: string,
  path: readonly string[],
  asNull = false
): LocalizedValueMap => {
  const entry = map[language]
  if (!isPlainObject(entry)) {
    return map
  }
  const nextEntry = unsetBlankPath(entry, path)
  if (nextEntry === entry) {
    return map
  }
  const next = { ...map }
  if (Object.keys(nextEntry).length > 0) {
    next[language] = nextEntry
  } else if (asNull) {
    next[language] = null
  } else {
    delete next[language]
  }
  return next
}

/**
 * Applies one field edit and prunes it like `pruneEditedField`. Clearing a
 * field that holds nothing changes nothing, so a stored value the form cannot
 * show around that field is not replaced; it returns `undefined` then.
 */
export const editLocalizedObjectField = (
  value: unknown,
  language: string,
  path: readonly string[],
  next: unknown,
  asNull = false
): LocalizedValueMap | undefined => {
  if (
    isBlank(next) &&
    getLocalizedObjectValue(value, language, path) === undefined
  ) {
    return undefined
  }
  return pruneEditedField(
    setLocalizedObjectValue(value, language, path, next),
    language,
    path,
    asNull
  )
}

const isLocked = (child: MixinsFormItem): boolean =>
  !!child.isReadonly || !!child.toDelete

// A nested object whose fields the form shows and lets the user change.
const isEditableGroup = (child: MixinsFormItem): boolean =>
  isNestedObjectMixinItem(child) && !isLocked(child)

// A field the localized OBJECT form shows but does not let the user change.
const isUneditable = (child: MixinsFormItem): boolean =>
  isLocked(child) || !hasLocalizedObjectInput(child)

const findChild = (
  children: readonly MixinsFormItem[],
  key: string
): MixinsFormItem | undefined =>
  children.find((child) => leafKey(child.key) === key)

// Keys that are not in the schema are not shown, and a nested object's fields
// are shown only when its value is an object, so those values stay as well.
// Blank values hold nothing, so they go and an emptied language can be removed.
const keepUneditable = (
  entry: Record<string, unknown>,
  children: readonly MixinsFormItem[]
): Record<string, unknown> => {
  const kept: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entry)) {
    const child = findChild(children, key)
    if (child !== undefined && isEditableGroup(child) && isPlainObject(value)) {
      const nested = keepUneditable(value, child.items ?? [])
      if (Object.keys(nested).length > 0) {
        kept[key] = nested
      }
    } else if (
      (child === undefined || isUneditable(child)) &&
      hasNonBlankValue(value)
    ) {
      kept[key] = value
    }
  }
  return kept
}

const dropUneditable = (
  entry: Record<string, unknown>,
  children: readonly MixinsFormItem[]
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entry)) {
    const child = findChild(children, key)
    if (child !== undefined && isEditableGroup(child)) {
      if (isPlainObject(value)) {
        out[key] = dropUneditable(value, child.items ?? [])
      }
    } else if (child !== undefined && !isUneditable(child)) {
      out[key] = value
    }
  }
  return out
}

/**
 * Clears one language: the same result as clearing each field the user can
 * edit. Read-only fields, fields without an input (arrays, nested localized
 * objects, objects without fields, unknown types) and keys that are not in the
 * schema keep their values unless they are blank; the language is removed (or
 * set to `null`) once nothing is left.
 */
export const clearLocalizedObjectLanguage = (
  value: unknown,
  language: string,
  asNull: boolean,
  children: readonly MixinsFormItem[] | undefined
): LocalizedValueMap => {
  const map = toLocalizedValueMap(value, 'object')
  const entry = map[language]
  const kept = isPlainObject(entry) ? keepUneditable(entry, children ?? []) : {}
  const next = { ...map }
  if (Object.keys(kept).length > 0) {
    next[language] = kept
    return next
  }
  delete next[language]
  return asNull ? { ...next, [language]: null } : next
}

/** Languages that hold at least one non-blank value. */
export const getLanguagesWithContent = (value: unknown): string[] =>
  Object.entries(toLocalizedValueMap(value, 'object'))
    .filter(([language, entry]) => hasLocalizedContent({ [language]: entry }))
    .map(([language]) => language)

/** Languages that hold a non-blank value the user can edit, so they can be cleared. */
export const getLanguagesWithEditableContent = (
  value: unknown,
  children: readonly MixinsFormItem[] | undefined
): string[] =>
  Object.entries(toLocalizedValueMap(value, 'object'))
    .filter(
      ([language, entry]) =>
        isPlainObject(entry) &&
        hasLocalizedContent({
          [language]: dropUneditable(entry, children ?? []),
        })
    )
    .map(([language]) => language)

/**
 * Languages whose values miss a required field, checked the same way as the
 * form validation. Absent and `null` languages are not checked.
 */
export const getLanguagesMissingRequired = (
  item: MixinsFormItem,
  value: unknown,
  siteOverlay = false
): string[] => {
  const leaf = leafKey(item.key)
  const mapItem: MixinsFormItem = {
    ...item,
    key: leaf,
    type: MixinsFormItemType.localized,
  }
  const isMissing = siteOverlay
    ? hasMissingRequiredSiteOverlayValues
    : hasMissingRequiredMixinValues
  return Object.entries(toLocalizedValueMap(value, 'object'))
    .filter(
      ([language, entry]) =>
        entry !== null &&
        isMissing({ [leaf]: { [language]: entry } }, [mapItem])
    )
    .map(([language]) => language)
}

/**
 * Label of a collapsed array row: the first non-blank top-level text field,
 * required fields first, read in the given language order.
 */
export const getLocalizedObjectSummary = (
  item: MixinsFormItem,
  value: unknown,
  languageIds: readonly string[]
): string => {
  const map = toLocalizedValueMap(value, 'object')
  const textFields = (item.items ?? []).filter(
    (child) => child.type === MixinsFormItemType.text && !child.toDelete
  )
  const textKeys = [
    ...textFields.filter((child) => child.isRequired),
    ...textFields.filter((child) => !child.isRequired),
  ].map((child) => leafKey(child.key))
  for (const key of textKeys) {
    for (const language of languageIds) {
      const entry = map[language]
      const text = entry && typeof entry === 'object' ? entry[key] : undefined
      if (typeof text === 'string' && text.trim() !== '') {
        return text.trim()
      }
    }
  }
  return ''
}
