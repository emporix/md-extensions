/**
 * Shared date formatting utilities.
 * Consolidates duplicated date formatters from order, quote, cart, return,
 * employee, and customer helpers.
 */

/** Simple MM/DD/YYYY formatting. */
export const formatShortDate = (isoString: string | undefined): string => {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/** Locale-aware date/time display (numeric month). */
export const formatDateTimeNumeric = (isoDate: string | undefined): string => {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Locale-aware date/time display (short month name). */
export const formatDateTimeShort = (isoDate: string | undefined): string => {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type TranslationFn = (
  key: string,
  params?: Record<string, string | number>
) => string

/** Relative date: "Today" / "1 day" / "X days" or falls back to MM/DD/YYYY. */
export const formatRelativeDate = (
  isoDate: string | undefined,
  now: Date = new Date(),
  t?: TranslationFn
): string => {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return t ? t('date.today') : 'Today'
  if (diffDays === 1) return t ? t('date.oneDay') : '1 day'
  if (diffDays > 1 && diffDays < 7)
    return t ? t('date.days', { count: diffDays }) : `${diffDays} days`
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

/** Uppercase status with underscores replaced by spaces. */
export const formatStatus = (status: string | undefined): string => {
  if (!status || typeof status !== 'string') return '—'
  return status.toUpperCase().replace(/_/g, ' ')
}
