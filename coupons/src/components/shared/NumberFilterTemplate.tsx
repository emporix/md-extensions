import { useEffect, useMemo, useRef, useState } from 'react'
import {
  InputNumber,
  Menu,
  type DataTableColumnFilterElementOptions,
  type InputNumberChangeEvent,
  type MenuItem,
  type MenuRef,
} from '@emporix/component-library'
import styles from './NumberFilterTemplate.module.scss'

export type NumberFilterMode = 'equals' | 'gt' | 'lt'

type NumberFilterValue = { value: number; mode: NumberFilterMode }

const MODE_SYMBOLS: Record<NumberFilterMode, string> = {
  equals: '=',
  gt: '>',
  lt: '<',
}

const isNumberFilterValue = (value: unknown): value is NumberFilterValue =>
  typeof value === 'object' &&
  value !== null &&
  'mode' in value &&
  'value' in value

type NumberFilterTemplateProps = {
  readonly filterOptions: DataTableColumnFilterElementOptions
  readonly decimalPlaces?: number
}

/**
 * Number column filter with an `=` / `>` / `<` mode switch. The filter value
 * is `{ value, mode }`, which `@emporix/api-calls` turns into `field:>value`
 * — same contract as MD `NumberFilterTemplate`.
 */
const NumberFilterTemplate = ({
  filterOptions,
  decimalPlaces = 0,
}: NumberFilterTemplateProps) => {
  const menuRef = useRef<MenuRef>(null)
  const [mode, setMode] = useState<NumberFilterMode>(() =>
    isNumberFilterValue(filterOptions.value)
      ? filterOptions.value.mode
      : 'equals'
  )
  const [numValue, setNumValue] = useState<number | null>(() => {
    if (isNumberFilterValue(filterOptions.value))
      return filterOptions.value.value
    if (typeof filterOptions.value === 'number') return filterOptions.value
    return null
  })

  useEffect(() => {
    if (filterOptions.value == null) {
      setNumValue(null)
      setMode('equals')
    } else if (isNumberFilterValue(filterOptions.value)) {
      setNumValue(filterOptions.value.value)
      setMode(filterOptions.value.mode)
    }
  }, [filterOptions.value])

  const applyFilter = (value: number | null, filterMode: NumberFilterMode) => {
    if (value === null) {
      filterOptions.filterApplyCallback(undefined, filterOptions.index)
      return
    }
    filterOptions.filterApplyCallback(
      { value, mode: filterMode },
      filterOptions.index
    )
  }

  const handleNumberChange = (e: InputNumberChangeEvent) => {
    setNumValue(e.value)
    applyFilter(e.value, mode)
  }

  const menuItems: MenuItem[] = useMemo(
    () =>
      (Object.keys(MODE_SYMBOLS) as NumberFilterMode[]).map((m) => ({
        label: MODE_SYMBOLS[m],
        command: () => {
          setMode(m)
          if (numValue !== null) applyFilter(numValue, m)
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [numValue, filterOptions]
  )

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={styles.mode}
        onClick={(e) => menuRef.current?.toggle(e)}
      >
        {MODE_SYMBOLS[mode]}
      </button>
      <InputNumber
        className={styles.input}
        value={numValue}
        onChange={handleNumberChange}
        minFractionDigits={decimalPlaces > 0 ? decimalPlaces : undefined}
        maxFractionDigits={decimalPlaces}
      />
      <Menu model={menuItems} popup ref={menuRef} />
    </div>
  )
}

export default NumberFilterTemplate
