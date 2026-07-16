export type TimestampValue =
  | string
  | number
  | Date
  | { $date?: string }
  | null
  | undefined

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
