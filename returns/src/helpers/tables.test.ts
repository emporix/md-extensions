import { FilterMatchMode } from '@emporix/component-library'
import { describe, expect, it } from 'vitest'
import { columnFiltersKeepingValues } from './tables'

const siteColumn = {
  columnKey: 'siteCode',
  filter: true,
  filterMatchMode: FilterMatchMode.EQUALS,
}

const nameColumn = {
  columnKey: 'firstName',
  filter: true,
}

describe('columnFiltersKeepingValues', () => {
  it('keeps an active filter when columns are rebuilt', () => {
    const current = {
      siteCode: { value: 'main', matchMode: FilterMatchMode.EQUALS },
      firstName: { value: 'Ann', matchMode: FilterMatchMode.CONTAINS },
    }

    expect(columnFiltersKeepingValues([siteColumn, nameColumn], current)).toEqual({
      siteCode: { value: 'main', matchMode: FilterMatchMode.EQUALS },
      firstName: { value: 'Ann', matchMode: FilterMatchMode.CONTAINS },
    })
    expect(current.siteCode.value).toBe('main')
  })

  it('starts a new column with an empty value', () => {
    expect(columnFiltersKeepingValues([siteColumn], undefined)).toEqual({
      siteCode: { value: null, matchMode: FilterMatchMode.EQUALS },
    })
  })

  it('uses contains when a column does not set a match mode', () => {
    expect(columnFiltersKeepingValues([nameColumn], {})).toEqual({
      firstName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })
  })

  it('skips columns that are not filterable', () => {
    expect(
      columnFiltersKeepingValues(
        [{ columnKey: 'actions', filter: false }, siteColumn],
        { siteCode: { value: 'main', matchMode: FilterMatchMode.EQUALS } }
      )
    ).toEqual({
      siteCode: { value: 'main', matchMode: FilterMatchMode.EQUALS },
    })
  })
})
