import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, CalendarChangeParams } from 'primereact/calendar'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'
import { useTranslation } from 'react-i18next'

interface Props {
  filterOptions: ColumnFilterElementTemplateOptions
  selectionMode?: 'single' | 'range'
}

export const DateFilterTemplate = (props: Props) => {
  const { filterOptions, selectionMode = 'single' } = props
  const { t } = useTranslation()
  const [rangeValue, setRangeValue] = useState<Date[]>()

  useEffect(() => {
    if (!filterOptions.value) {
      setRangeValue(undefined)
    } else if (Array.isArray(filterOptions.value)) {
      setRangeValue(filterOptions.value.map((v: string) => new Date(v)))
    }
  }, [filterOptions.value])

  const handleChange = (e: CalendarChangeParams) => {
    if (selectionMode === 'range') {
      if (Array.isArray(e.value)) {
        const [start, end] = e.value as Date[]
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
    } else {
      const date = e.value as Date
      if (!date) {
        filterOptions.filterApplyCallback(undefined, filterOptions.index)
        return
      }
      filterOptions.filterApplyCallback(
        [date.toISOString(), date.toISOString()],
        filterOptions.index
      )
    }
  }

  const toDateValue = (value: unknown) => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === 'string') return new Date(value)
    if (Array.isArray(value)) {
      const dates = value.map((v) => new Date(v || ''))
      return selectionMode === 'single' ? dates[0] : dates
    }
    return undefined
  }

  const calendarValue = useMemo(() => {
    if (selectionMode === 'range') {
      return rangeValue ?? toDateValue(filterOptions.value)
    } else {
      return toDateValue(filterOptions.value)
    }
  }, [rangeValue, filterOptions.value])

  return (
    <Calendar
      style={{ minWidth: '180px' }}
      value={calendarValue}
      onChange={handleChange}
      selectionMode={selectionMode}
      dateFormat={t('global.dateFormat')}
      showButtonBar
    />
  )
}
