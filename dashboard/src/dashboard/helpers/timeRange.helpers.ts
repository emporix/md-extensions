import type { TimeRangePreset } from '../models/DashboardContext.types'

const PRESET_LABELS: Record<TimeRangePreset, string> = {
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  mtd: 'MTD',
  ytd: 'YTD',
  custom: 'Custom',
}

export const getTimeRangePresetLabel = (preset: TimeRangePreset): string =>
  PRESET_LABELS[preset] ?? preset

const startOfDay = (d: Date): Date => {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

const endOfDay = (d: Date): Date => {
  const out = new Date(d)
  out.setHours(23, 59, 59, 999)
  return out
}

export const getRangeForPreset = (
  preset: TimeRangePreset,
  referenceDate: Date = new Date()
): { from: Date; to: Date } => {
  const today = startOfDay(referenceDate)
  const to = endOfDay(referenceDate)

  switch (preset) {
    case 'last7': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from: startOfDay(from), to }
    }
    case 'last30': {
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { from: startOfDay(from), to }
    }
    case 'mtd': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from, to }
    }
    case 'ytd': {
      const from = new Date(today.getFullYear(), 0, 1)
      return { from, to }
    }
    case 'custom':
      return { from: today, to }
    default:
      return { from: today, to }
  }
}

/** Format date as YYYY-MM-DD for API/storage */
export const toISODateString = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD string to Date at start of day (local) */
export const parseISODateString = (s: string): Date => {
  if (typeof s !== 'string') return new Date(NaN)
  const trimmed = s.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(NaN)
  const [y, m, d] = trimmed.split('-').map(Number)
  if (
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return new Date(NaN)
  }

  const parsed = new Date(y, m - 1, d)
  const isExactDate =
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  return isExactDate ? parsed : new Date(NaN)
}

/**
 * Normalizes a PrimeReact Calendar range selection into a valid {from, to} pair.
 * Returns null if the selection is invalid (not an array, no valid start date).
 */
export const normalizeCalendarRange = (
  value: Date | Date[] | undefined
): { from: Date; to: Date } | null => {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  const start = value[0] instanceof Date ? value[0] : null
  const end = value.length > 1 && value[1] instanceof Date ? value[1] : null
  if (!start) return null
  const to = end && end >= start ? end : start
  return { from: start, to }
}

/** Display format for range input (e.g. 02/09/2026 - 02/16/2026) */
export const formatDateRangeDisplay = (from: string, to: string): string => {
  const fromDate = parseISODateString(from)
  const toDate = parseISODateString(to)
  const fmt = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
  }
  return `${fmt(fromDate)} - ${fmt(toDate)}`
}
