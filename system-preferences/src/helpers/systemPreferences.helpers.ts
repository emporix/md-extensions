import type {
  SystemPreferenceDefinition,
  SystemPreferenceType,
} from '../configs/systemPreferences'

/** A listed preference with what the tenant has stored for it. */
export interface SystemPreferenceRow extends SystemPreferenceDefinition {
  /** Translated name; the Name column shows and filters on it. */
  readonly name: string
  /** Stored value; always empty for a secured preference. */
  readonly value?: unknown
  /** The tenant has a configuration under this key. */
  readonly existing?: boolean
}

export interface PreferencePayload {
  key: string
  value: unknown
  secured?: boolean
}

export interface PreferenceDisplayInput {
  readonly type: string
  readonly existing?: boolean
}

export interface PreferenceSaveInput {
  readonly key: string
  readonly type: string
  readonly secured?: boolean
}

export const buildPreferencePayload = (
  pref: PreferenceSaveInput,
  value: unknown
): PreferencePayload => {
  if (pref.secured === true) {
    return { key: pref.key, value, secured: true }
  }
  return { key: pref.key, value }
}

export const shouldSkipSave = (
  pref: Pick<PreferenceSaveInput, 'type'>,
  value: unknown
): boolean =>
  pref.type === 'PASSWORD' &&
  (value === undefined || value === null || value === '')

export const displayValue = (pref: PreferenceDisplayInput): string => {
  if (pref.type !== 'PASSWORD') {
    return ''
  }
  return pref.existing ? '********' : ''
}

export const canClear = (pref: {
  secured?: boolean
  existing?: boolean
}): boolean => pref.secured === true && pref.existing === true

/** The stored value, or the default while the tenant has none. */
export const currentValue = (pref: {
  readonly value?: unknown
  readonly defaultValue?: string
}): unknown => pref.value ?? pref.defaultValue

/** `true`, `"true"` and `"TRUE"` are on; anything else, empty included, is off. */
export const toBoolean = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'boolean') {
    return value
  }
  return String(value).toLowerCase() === 'true'
}

/** A list value as the comma-separated text the list editor edits. */
export const listText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return value === null || value === undefined ? '' : String(value)
}

/** The Value cell text of a preference that is not a switch. */
export const cellText = (pref: {
  readonly type: string
  readonly value?: unknown
  readonly defaultValue?: string
  readonly existing?: boolean
}): string => {
  if (pref.type === 'PASSWORD') {
    return displayValue(pref)
  }
  if (pref.type === 'LIST') {
    return listText(currentValue(pref))
  }
  const value = currentValue(pref)
  return value === null || value === undefined ? '' : String(value)
}

/** The editor's value turned into what the configuration stores for the type. */
export const toPreferenceValue = (
  type: SystemPreferenceType,
  value: unknown
): unknown => {
  if (!value && type !== 'LIST') {
    return value
  }
  switch (type) {
    case 'TEXT':
    case 'PASSWORD':
    case 'ENUM':
      return value
    case 'NUMBER':
      return Number(value)
    case 'BOOLEAN':
      return toBoolean(value)
    case 'LIST':
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      }
      return Array.isArray(value) ? value : []
    default:
      return undefined
  }
}

/** The API's detail messages, else its message, for the error toast. */
export const preferenceErrorDetails = (
  error: unknown
): string | string[] | undefined => {
  const data = (error as { response?: { data?: unknown } } | null)?.response
    ?.data as { message?: unknown; details?: unknown } | undefined
  if (!data) {
    return undefined
  }
  if (Array.isArray(data.details)) {
    const messages = data.details
      .map((detail) => (detail as { message?: unknown } | null)?.message)
      .filter(
        (message): message is string =>
          typeof message === 'string' && message.length > 0
      )
    if (messages.length > 0) {
      return messages
    }
  }
  return typeof data.message === 'string' && data.message.length > 0
    ? data.message
    : undefined
}
