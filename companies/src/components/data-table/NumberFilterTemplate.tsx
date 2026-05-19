import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InputNumber, InputNumberChangeParams } from 'primereact/inputnumber'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'
import { Menu } from 'primereact/menu'
import { MenuItem } from 'primereact/menuitem'
import { isNumberFilterValue, NumberFilterMode } from 'helpers/params'

interface Props {
  filterOptions: ColumnFilterElementTemplateOptions
  decimalPlaces?: number
}

const MODE_SYMBOLS: Record<NumberFilterMode, string> = {
  equals: '=',
  gt: '>',
  lt: '<',
}

const NumberFilterTemplate = (props: Props) => {
  const { filterOptions, decimalPlaces = 0 } = props
  const menuRef = useRef<Menu>(null)

  const [mode, setMode] = useState<NumberFilterMode>(() => {
    if (isNumberFilterValue(filterOptions.value)) {
      return filterOptions.value.mode
    }
    return 'equals'
  })

  const [numValue, setNumValue] = useState<number | null>(() => {
    if (isNumberFilterValue(filterOptions.value)) {
      return filterOptions.value.value
    }
    if (typeof filterOptions.value === 'number') {
      return filterOptions.value
    }
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

  const applyFilter = useCallback(
    (value: number | null, filterMode: NumberFilterMode) => {
      if (value === null || value === undefined) {
        filterOptions.filterApplyCallback(undefined, filterOptions.index)
        return
      }
      filterOptions.filterApplyCallback(
        { value, mode: filterMode },
        filterOptions.index
      )
    },
    [filterOptions]
  )

  const handleNumberChange = (e: InputNumberChangeParams) => {
    const val = e.value
    setNumValue(val)
    applyFilter(val, mode)
  }

  const handleModeChange = (newMode: NumberFilterMode) => {
    setMode(newMode)
    if (numValue !== null) {
      applyFilter(numValue, newMode)
    }
  }

  const menuItems: MenuItem[] = useMemo(() => {
    return Object.keys(MODE_SYMBOLS).map((m) => ({
      label: `${MODE_SYMBOLS[m as NumberFilterMode]}`,
      command: () => handleModeChange(m as NumberFilterMode),
    }))
  }, [handleModeChange])

  return (
    <div className="p-inputgroup" style={{ minWidth: '180px' }}>
      <div
        onClick={(e) => menuRef.current?.toggle(e)}
        className="cursor-pointer flex align-items-center justify-content-center"
        style={{
          width: '2.5rem',
          minWidth: '2.5rem',
          fontSize: '1rem',
          color: 'var(--grey-5)',
          border: '1px solid var(--grey-4)',
          borderRight: 'none',
          borderRadius: '4px 0 0 4px',
        }}
      >
        {MODE_SYMBOLS[mode]}
      </div>
      <InputNumber
        value={numValue}
        onChange={handleNumberChange}
        minFractionDigits={decimalPlaces > 0 ? decimalPlaces : undefined}
        maxFractionDigits={decimalPlaces}
        style={{ width: '100%' }}
      />
      <Menu
        style={{ width: 'fit-content' }}
        model={menuItems}
        popup
        ref={menuRef}
      />
    </div>
  )
}

export default NumberFilterTemplate
