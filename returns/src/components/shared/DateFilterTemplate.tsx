import { useMemo } from 'react'
import {
  InputText,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import styles from './DateFilterTemplate.module.scss'

interface DateFilterTemplateProps {
  readonly filterOptions: DataTableColumnFilterElementOptions
  readonly selectionMode?: 'single' | 'range'
}

/**
 * Column filter for date fields.
 *
 * MD used PrimeReact `Calendar`; the component library exposes no date picker,
 * so this uses native `<input type="date">` through CL `InputText`. The filter
 * value contract is unchanged: an `[fromISO, toISO]` pair, or `undefined` when
 * cleared.
 */

/** `<input type="date">` needs `YYYY-MM-DD`. */
const toDateInputValue = (value: unknown): string => {
  if (!value) {
    return ''
  }
  const parsed = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate()
  )}`
}

const startOfDayIso = (value: string) => new Date(value).toISOString()

const endOfDayIso = (value: string) => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export const DateFilterTemplate = ({
  filterOptions,
  selectionMode = 'single',
}: DateFilterTemplateProps) => {
  const [fromValue, toValue] = useMemo(() => {
    const value = filterOptions.value
    if (Array.isArray(value)) {
      return [toDateInputValue(value[0]), toDateInputValue(value[1])]
    }
    const single = toDateInputValue(value)
    return [single, single]
  }, [filterOptions.value])

  const apply = (next: string[] | undefined) => {
    filterOptions.filterApplyCallback(next, filterOptions.index)
  }

  if (selectionMode === 'single') {
    return (
      <InputText
        className={styles.dateFilter}
        type="date"
        value={fromValue}
        onChange={(e) => {
          const raw = e.target.value
          apply(raw ? [startOfDayIso(raw), endOfDayIso(raw)] : undefined)
        }}
      />
    )
  }

  const applyRange = (from: string, to: string) => {
    if (!from && !to) {
      apply(undefined)
      return
    }
    if (from && to) {
      apply([startOfDayIso(from), endOfDayIso(to)])
    }
  }

  return (
    <div className={styles.range}>
      <InputText
        className={styles.dateFilter}
        type="date"
        value={fromValue}
        onChange={(e) => applyRange(e.target.value, toValue)}
      />
      <InputText
        className={styles.dateFilter}
        type="date"
        value={toValue}
        onChange={(e) => applyRange(fromValue, e.target.value)}
      />
    </div>
  )
}

export default DateFilterTemplate
