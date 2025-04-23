import i18n from '../translations/i18n'
import { TFunction } from 'react-i18next'

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
  // @ts-ignore
  return new Date(dateObj - timeZoneOffset).toISOString().slice(0, 7)
}

export const formatChartDate = (
  date: Date | string | undefined,
  groupBy: string,
  locale: string | undefined,
  t: TFunction
): string => {
  if (!date) {
    return new Date().toLocaleString()
  }
  let time = new Date().getTime()
  if (!(date instanceof Date)) {
    try {
      time = Date.parse(date)
    } catch (e) {
      console.error('in formatChartDate - date is ' + date)
      console.error(e)
    }
  }

  return chartDateLabel(time, groupBy, locale ? locale : i18n.language, t)
}

const chartDateLabel = (
  time: number,
  groupBy: string,
  locale: string,
  t: TFunction
): string => {
  locale = locale.replace('_', '-')
  try {
    const date = new Date(time)

    switch (groupBy.toLocaleLowerCase()) {
      case 'd': {
        const o: Intl.DateTimeFormatOptions = {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }

        return date.toLocaleDateString(locale, o)
      }
      case 'w': {
        return (
          t('dashboard.calendar.w') +
          ' ' +
          getISOWeek(time).toString() +
          '/' +
          getISOWeekYear(time).toString()
        )
      }
      case 'm': {
        const o: Intl.DateTimeFormatOptions = {
          month: 'short',
          year: 'numeric',
        }
        return date.toLocaleDateString(locale, o)
      }
      case 'y': {
        const o: Intl.DateTimeFormatOptions = { year: 'numeric' }
        return date.toLocaleDateString(locale, o)
      }
      default: {
        return new Date(time).toLocaleString()
      }
    }
  } catch (err) {
    return new Date(time).toLocaleString()
  }
}
// Returns the ISO week of the date.
export const getISOWeek = (t: number): number => {
  const date = new Date(t)
  date.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4)
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}

export const getISOWeekYear = (t: number): number => {
  const date = new Date(t)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  return date.getFullYear()
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
