import i18n from '../translations/i18n'

const getLocalizedDate = (
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions
) => {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch (error) {
    console.error(`Error formatting date: ${error}`)
    return undefined
  }
}

export const formatDateWithoutTimezone = (raw: string) => {
  const date = new Date(raw)
  const oneMinInMilis = 60000
  const utcDate = new Date(
    date.getTime() - date.getTimezoneOffset() * oneMinInMilis
  )
  return utcDate.toISOString().substring(0, 10)
}

export const formatDate = (
  date: Date | string | number | undefined,
  locale = i18n.language,
  nullText = '--'
) => {
  if (!date) return nullText
  const formattedDate = date instanceof Date ? date : new Date(date)
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  const textDate = getLocalizedDate(formattedDate, locale, dateOptions)
  return textDate ? textDate : nullText
}

export const formatDateWithTime = (
  date: Date | string | number | undefined,
  locale = i18n.language,
  nullText = '--'
) => {
  if (!date) return nullText
  const formattedDate = date instanceof Date ? date : new Date(date)
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: new Intl.DateTimeFormat(locale).resolvedOptions().hour12,
  }
  const textDate = getLocalizedDate(formattedDate, locale, dateOptions)
  return textDate ? textDate : nullText
}

export const formatDateOnlyTime = (
  date: Date | string | number | undefined,
  locale = i18n.language,
  nullText = '--'
) => {
  if (!date) return nullText
  const formattedDate = date instanceof Date ? date : new Date(date)
  const dateOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: new Intl.DateTimeFormat(locale).resolvedOptions().hour12,
  }
  const textDate = getLocalizedDate(formattedDate, locale, dateOptions)
  return textDate ? textDate : nullText
}

export const formatDateWithLongMonth = (
  date: Date | string | number | undefined,
  locale = i18n.language,
  nullText = '--'
) => {
  if (!date) return nullText
  const formattedDate = date instanceof Date ? date : new Date(date)
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
  }
  const textDate = getLocalizedDate(formattedDate, locale, dateOptions)
  return textDate ? textDate : nullText
}

export const getFromDate = (date: Date = new Date()) => {
  //date.setDate(date.getDate() - 1)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return toTimezoneISOString(d)
}

export const getToDate = (date: Date = new Date()) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 0)
  return toTimezoneISOString(d)
}

export const getDateFilter = (date: Date = new Date()) => {
  if (Array.isArray(date) && date.length == 2) {
    return '(>"' + getFromDate(date[0]) + '"+AND+<"' + getToDate(date[1]) + '")'
  } else if (Array.isArray(date) && date.length == 1) {
    return '(>"' + getFromDate(date[0]) + '"+AND+<"' + getToDate(date[0]) + '")'
  } else {
    return '(>"' + getFromDate(date) + '"+AND+<"' + getToDate(date) + '")'
  }
}

export const getDateString = (date: string | Date) => {
  const dateObj = new Date(date)
  const timeZoneOffset = dateObj.getTimezoneOffset() * 60000
  return new Date(dateObj.getTime() - timeZoneOffset).toISOString().slice(0, 7)
}

//adjusted toISOString to include the timezone rather than converting it with UTC
export const toTimezoneISOString = (d: Date): string => {
  const td = new Date(d)
  td.setMinutes(td.getMinutes() - d.getTimezoneOffset())
  return td.toISOString()
}

//time zone may change if past day is i.e. not in BST but in GMT
export const last7Days = (currentDate: Date, startAtZero?: boolean): Date => {
  const d = new Date(currentDate)

  d.setDate(d.getDate() - 7)

  if (startAtZero) {
    d.setHours(0, 0, 0, 0)
  }

  return d
}
export const last30Days = (currentDate: Date, startAtZero?: boolean): Date => {
  const d = new Date(currentDate)
  d.setDate(d.getDate() - 30)
  if (startAtZero) {
    d.setHours(0, 0, 0, 0)
  }
  return d
}

export const monthToDate = (currentDate: Date): Date => {
  const d = new Date(currentDate)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export const yearToDate = (currentDate: Date): Date => {
  const d = new Date(currentDate)
  d.setFullYear(currentDate.getFullYear(), 0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0]
}
