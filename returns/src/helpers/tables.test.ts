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

  it('keeps a date range together with an active site filter', () => {
    const createdAt = [
      '2026-10-01T00:00:00.000Z',
      '2026-10-22T00:00:00.000Z',
    ]
    const expiryDate = [
      '2026-11-01T00:00:00.000Z',
      '2026-11-19T00:00:00.000Z',
    ]
    const current = {
      siteCode: { value: 'TST', matchMode: FilterMatchMode.EQUALS },
      'metadata.createdAt': {
        value: createdAt,
        matchMode: FilterMatchMode.CONTAINS,
      },
      expiryDate: { value: expiryDate, matchMode: FilterMatchMode.CONTAINS },
    }

    expect(
      columnFiltersKeepingValues(
        [
          siteColumn,
          { columnKey: 'metadata.createdAt', filter: true },
          { columnKey: 'expiryDate', filter: true },
        ],
        current
      )
    ).toEqual({
      siteCode: { value: 'TST', matchMode: FilterMatchMode.EQUALS },
      'metadata.createdAt': {
        value: createdAt,
        matchMode: FilterMatchMode.CONTAINS,
      },
      expiryDate: { value: expiryDate, matchMode: FilterMatchMode.CONTAINS },
    })
    expect(current['metadata.createdAt'].value).toEqual(createdAt)
    expect(current.expiryDate.value).toEqual(expiryDate)
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
