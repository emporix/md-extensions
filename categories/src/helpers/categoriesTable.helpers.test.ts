import { describe, expect, it } from 'vitest'
import {
  CATEGORIES_TABLE_KEY,
  toColumnVisibility,
} from './categoriesTable.helpers'

const columns = [
  { columnKey: 'id', header: 'Id' },
  { columnKey: 'code', header: 'Code' },
  { columnKey: 'validity.from', header: 'Valid from' },
]

describe('toColumnVisibility', () => {
  it('keeps MD key for the persisted preference', () => {
    expect(CATEGORIES_TABLE_KEY).toBe('ext_categories')
  })

  it('shows every column without a saved preference', () => {
    expect(toColumnVisibility(columns, [])).toEqual([
      { key: 'id', label: 'Id', visible: true },
      { key: 'code', label: 'Code', visible: true },
      { key: 'validity.from', label: 'Valid from', visible: true },
    ])
  })

  it('honours a preference saved in the built-in screen', () => {
    expect(
      toColumnVisibility(columns, [
        { key: 'code', label: 'Code', visible: false },
        { key: 'removed', label: 'Gone', visible: false },
      ])
    ).toEqual([
      { key: 'id', label: 'Id', visible: true },
      { key: 'code', label: 'Code', visible: false },
      { key: 'validity.from', label: 'Valid from', visible: true },
    ])
  })
})
