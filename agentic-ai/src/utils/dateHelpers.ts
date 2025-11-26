export const toTimezoneISOString = (d: Date): string => {
  const td = new Date(d)
  td.setMinutes(td.getMinutes() - d.getTimezoneOffset())
  return td.toISOString()
}

export const getFromDate = (date: Date = new Date()): string => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return toTimezoneISOString(d)
}

export const getToDate = (date: Date = new Date()): string => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 0)
  return toTimezoneISOString(d)
}

export const getDateFilter = (date: Date): string => {
  return `(>="${getFromDate(date)}" AND <"${getToDate(date)}")`
}

export const formatDateWithoutTimezone = (raw: string | Date): string => {
  const date = typeof raw === 'string' ? new Date(raw) : raw
  const oneMinInMillis = 60000
  const utcDate = new Date(
    date.getTime() - date.getTimezoneOffset() * oneMinInMillis
  )
  return utcDate.toISOString().substring(0, 10)
}
