import { describe, expect, it, vi } from 'vitest'

vi.mock('@emporix/api-calls', () => ({
  ChangelogChangeType: {
    toUi: (api: string) =>
      (
        ({
          create: 'created',
          update: 'updated',
          delete: 'deleted',
        }) as Record<string, string>
      )[api] ?? api,
  },
}))

import {
  buildRelatedEntityBadgeLabel,
  filterMeaningfulChangelogPaths,
  formatChangelogValue,
  getChangeTypeKey,
  getOtherRelatedItems,
} from './entityChangelog.helpers'

describe('buildRelatedEntityBadgeLabel', () => {
  it('appends the other related entity label after a separator', () => {
    expect(buildRelatedEntityBadgeLabel('Group assignment', 'Group')).toBe(
      'Group assignment - Group'
    )
  })

  it('returns only the root label when no related entity label is provided', () => {
    expect(buildRelatedEntityBadgeLabel('Group assignment')).toBe(
      'Group assignment'
    )
  })
})

describe('getOtherRelatedItems', () => {
  it('returns related items that do not match the current entity context', () => {
    const related = [
      { entity: 'employee', entityId: 'employee-1' },
      { entity: 'group', entityId: 'group-1' },
    ]

    expect(getOtherRelatedItems(related, 'employee', 'employee-1')).toEqual([
      { entity: 'group', entityId: 'group-1' },
    ])
    expect(getOtherRelatedItems(related, 'group', 'group-1')).toEqual([
      { entity: 'employee', entityId: 'employee-1' },
    ])
  })

  it('returns an empty array when related is missing or empty', () => {
    expect(getOtherRelatedItems(undefined, 'employee', 'employee-1')).toEqual(
      []
    )
    expect(getOtherRelatedItems([], 'employee', 'employee-1')).toEqual([])
  })
})

describe('getChangeTypeKey', () => {
  it('maps API change types to UI values', () => {
    expect(getChangeTypeKey('create')).toBe('created')
    expect(getChangeTypeKey('update')).toBe('updated')
    expect(getChangeTypeKey('delete')).toBe('deleted')
  })

  it('returns the input when no mapping exists', () => {
    expect(getChangeTypeKey('custom')).toBe('custom')
  })
})

describe('formatChangelogValue', () => {
  it('returns null for null, undefined, and other empty values', () => {
    expect(formatChangelogValue(null)).toBeNull()
    expect(formatChangelogValue(undefined)).toBeNull()
    expect(formatChangelogValue('')).toBeNull()
    expect(formatChangelogValue([])).toBeNull()
    expect(formatChangelogValue({})).toBeNull()
  })

  it('stringifies object values', () => {
    expect(formatChangelogValue({ status: 'open' })).toBe('{"status":"open"}')
  })

  it('converts primitive values to strings', () => {
    expect(formatChangelogValue('active')).toBe('active')
    expect(formatChangelogValue(42)).toBe('42')
    expect(formatChangelogValue(false)).toBe('false')
  })
})

describe('filterMeaningfulChangelogPaths', () => {
  it('drops paths where both before and after are empty', () => {
    expect(
      filterMeaningfulChangelogPaths({
        cleared: { before: {}, after: null },
        blank: { before: '', after: [] },
        kept: { before: 'a', after: 'b' },
      })
    ).toEqual({
      kept: { before: 'a', after: 'b' },
    })
  })

  it('keeps empty-to-value, value-to-empty, and value-to-value changes', () => {
    expect(
      filterMeaningfulChangelogPaths({
        created: { before: null, after: 'new' },
        cleared: { before: 'old', after: '' },
        updated: { before: 'a', after: 'b' },
      })
    ).toEqual({
      created: { before: null, after: 'new' },
      cleared: { before: 'old', after: '' },
      updated: { before: 'a', after: 'b' },
    })
  })
})
