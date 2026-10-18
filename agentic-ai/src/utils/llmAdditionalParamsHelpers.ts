const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const sortJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue)
  }
  if (!isPlainObject(value)) {
    return value
  }
  const sorted = Object.create(null) as Record<string, unknown>
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortJsonValue(value[key])
  }
  return sorted
}

export const stringifyAdditionalParams = (
  additionalParams: Record<string, unknown> | null | undefined
): string => {
  if (!additionalParams || Object.keys(additionalParams).length === 0) {
    return ''
  }
  return `${JSON.stringify(sortJsonValue(additionalParams), null, 2)}\n`
}

export type AdditionalParamsParseResult =
  | { readonly ok: true; readonly value: Record<string, unknown> | null }
  | { readonly ok: false; readonly error: string }

export const parseAdditionalParamsJson = (
  json: string
): AdditionalParamsParseResult => {
  const trimmed = json.trim()
  if (!trimmed) {
    return { ok: true, value: null }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    return { ok: false, error: 'invalid_json' }
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'must_be_object' }
  }

  return { ok: true, value: parsed }
}

export const normalizeAdditionalParamsForSave = (
  value: Record<string, unknown> | null
): Record<string, unknown> | null => {
  if (!value || Object.keys(value).length === 0) {
    return null
  }
  return value
}

export const hasNonEmptyAdditionalParamsJson = (json: string): boolean =>
  json.trim().length > 0
