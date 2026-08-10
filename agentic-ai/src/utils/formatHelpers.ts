export type TimestampValue =
  | string
  | number
  | Date
  | { $date?: string }
  | null
  | undefined

export const normalizeEscapedNewlines = (message: string): string =>
  message.replace(/\\n/g, '\n')

const CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i

const isJsonStructure = (
  value: unknown
): value is Record<string, unknown> | unknown[] =>
  value !== null && typeof value === 'object'

const tryParseJsonStructure = (text: string): unknown | null => {
  try {
    let parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'string') {
      const inner = parsed.trim()
      if (inner.startsWith('{') || inner.startsWith('[')) {
        parsed = JSON.parse(inner)
      }
    }
    if (isJsonStructure(parsed)) {
      return parsed
    }
  } catch {
    return null
  }
  return null
}

/** Pretty-print JSON message/response bodies; otherwise normalize escaped newlines. */
export const formatReadableCommunicationContent = (content: string): string => {
  const trimmed = content.trim()
  if (!trimmed) {
    return content
  }

  const candidates = [trimmed]
  const codeMatch = CODE_BLOCK_REGEX.exec(trimmed)
  if (codeMatch?.[1]) {
    candidates.unshift(codeMatch[1].trim())
  }

  for (const candidate of candidates) {
    const parsed = tryParseJsonStructure(candidate)
    if (parsed !== null) {
      return JSON.stringify(parsed, null, 2)
    }
  }

  return normalizeEscapedNewlines(content)
}

export const normalizeTimestampInput = (
  value: TimestampValue
): string | null => {
  if (value == null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value)
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (typeof value === 'object' && '$date' in value) {
    const dateValue = value.$date
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim()
      return trimmed || null
    }
  }

  return null
}

export const formatTimestamp = (timestamp: TimestampValue): string => {
  const normalized = normalizeTimestampInput(timestamp)
  if (!normalized) {
    return ''
  }

  try {
    const date = normalized.includes('T')
      ? new Date(normalized)
      : new Date(parseInt(normalized, 10))
    if (Number.isNaN(date.getTime())) {
      return normalized
    }
    return date.toLocaleString()
  } catch {
    return normalized
  }
}

export const formatDateObject = (dateObj: string): string => {
  try {
    return new Date(dateObj).toISOString()
  } catch {
    return dateObj
  }
}
