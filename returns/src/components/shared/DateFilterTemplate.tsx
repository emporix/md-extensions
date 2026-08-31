import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  type CalendarChangeEvent,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import { getLocaleHourFormat } from '../../helpers/date'
import styles from './DateFilterTemplate.module.scss'

interface DateFilterTemplateProps {
  readonly filterOptions: DataTableColumnFilterElementOptions
  readonly selectionMode?: 'single' | 'range'
  readonly showTime?: boolean
}

const toDateValue = (
  value: unknown,
  selectionMode: 'single' | 'range'
): Date | Date[] | undefined => {
  if (!value) {
    return undefined
  }
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string') {
    return new Date(value)
  }
  if (Array.isArray(value)) {
    const dates = value.map((entry) => new Date(entry || ''))
    return selectionMode === 'single' ? dates[0] : dates
  }
  return undefined
}

/**
 * Column filter for date fields.
 *
 * Wraps CL `Calendar` (PrimeReact overlay, styles encapsulated in the library).
 * Filter value contract is an `[fromISO, toISO]` pair, or `undefined` when
 * cleared — same as MD `DateFilterTemplate`.
 */
export const DateFilterTemplate = ({
  filterOptions,
  selectionMode = 'single',
  showTime = false,
}: DateFilterTemplateProps) => {
  const { t, i18n } = useTranslation()
  const [rangeValue, setRangeValue] = useState<Date[]>()

  useEffect(() => {
    if (!filterOptions.value) {
      setRangeValue(undefined)
    } else if (Array.isArray(filterOptions.value)) {
      setRangeValue(filterOptions.value.map((entry: string) => new Date(entry)))
    }
  }, [filterOptions.value])

  const handleChange = (event: CalendarChangeEvent) => {
    if (selectionMode === 'range') {
      if (Array.isArray(event.value)) {
        const start = event.value[0]
        const end = event.value[1]
        setRangeValue([start, end])
        if (start && end) {
          filterOptions.filterApplyCallback(
            [start.toISOString(), end.toISOString()],
            filterOptions.index
          )
        } else if (!start && !end) {
          setRangeValue(undefined)
          filterOptions.filterApplyCallback(undefined, filterOptions.index)
        }
      } else {
        setRangeValue(undefined)
        filterOptions.filterApplyCallback(undefined, filterOptions.index)
      }
      return
    }

    const date = event.value instanceof Date ? event.value : undefined
    if (!date) {
      filterOptions.filterApplyCallback(undefined, filterOptions.index)
      return
    }
    filterOptions.filterApplyCallback(
      [date.toISOString(), date.toISOString()],
      filterOptions.index
    )
  }

  const calendarValue = useMemo(() => {
    if (selectionMode === 'range') {
      return rangeValue ?? toDateValue(filterOptions.value, selectionMode)
    }
    return toDateValue(filterOptions.value, selectionMode)
  }, [rangeValue, filterOptions.value, selectionMode])

  return (
    <Calendar
      className={styles.dateFilter}
      style={{ minWidth: showTime ? '220px' : '180px' }}
      value={calendarValue}
      onChange={handleChange}
      selectionMode={selectionMode}
      dateFormat={t('global.dateFormat')}
      showTime={showTime}
      hourFormat={getLocaleHourFormat(i18n.language)}
      showButtonBar
    />
  )
}

export default DateFilterTemplate
