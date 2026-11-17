import { describe, expect, it } from 'vitest'
import {
  CLASSIFICATIONS_TABLE_KEY,
  toColumnVisibility,
} from './classificationsTable.helpers'

const columns = [
  { columnKey: 'name', header: 'Name' },
  { columnKey: 'validFrom', header: 'Valid From' },
  { columnKey: 'validTo', header: 'Valid To' },
]

describe('toColumnVisibility', () => {
  it('keeps MD key for the persisted preference', () => {
    expect(CLASSIFICATIONS_TABLE_KEY).toBe('ext_classifications')
  })

  it('shows every column without a saved preference', () => {
    expect(toColumnVisibility(columns, [])).toEqual([
      { key: 'name', label: 'Name', visible: true },
      { key: 'validFrom', label: 'Valid From', visible: true },
      { key: 'validTo', label: 'Valid To', visible: true },
    ])
  })

  it('honours a preference saved in the built-in screen', () => {
    expect(
      toColumnVisibility(columns, [
        { key: 'validFrom', label: 'Valid From', visible: false },
        { key: 'removed', label: 'Gone', visible: false },
      ])
    ).toEqual([
      { key: 'name', label: 'Name', visible: true },
      { key: 'validFrom', label: 'Valid From', visible: false },
      { key: 'validTo', label: 'Valid To', visible: true },
    ])
  })

  it('does not change the saved preference', () => {
    const saved = [{ key: 'validTo', label: 'Valid To', visible: false }]
    const original = structuredClone(saved)

    toColumnVisibility(columns, saved)

    expect(saved).toEqual(original)
  })
})
