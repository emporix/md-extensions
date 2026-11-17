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
    toApi: (ui: string) =>
      (
        ({
          created: 'create',
          updated: 'update',
          deleted: 'delete',
        }) as Record<string, string>
      )[ui] ?? ui,
    UI_VALUES: ['created', 'updated', 'deleted'],
  },
}))

import {
  ChangelogChangeType,
  toChangelogOptions,
  toChangelogPagination,
} from './changelog.helpers'

describe('toChangelogPagination', () => {
  it('returns undefined when pagination is empty', () => {
    expect(toChangelogPagination(undefined)).toBeUndefined()
    expect(toChangelogPagination({})).toBeUndefined()
  })

  it('maps currentPage and rows', () => {
    expect(toChangelogPagination({ currentPage: 2, rows: 25 })).toEqual({
      currentPage: 2,
      rows: 25,
    })
  })
})

describe('toChangelogOptions', () => {
  it('returns undefined when options are missing', () => {
    expect(toChangelogOptions(undefined)).toBeUndefined()
  })

  it('maps entity filter and pagination', () => {
    expect(
      toChangelogOptions({
        pagination: { currentPage: 1, rows: 10 },
        filter: { entity: 'employee', entityId: 'user-1' },
      })
    ).toEqual({
      pagination: { currentPage: 1, rows: 10 },
      filter: { entity: 'employee', entityId: 'user-1' },
    })
  })
})

describe('ChangelogChangeType', () => {
  it('maps API change types to UI values', () => {
    expect(ChangelogChangeType.toUi('create')).toBe('created')
    expect(ChangelogChangeType.toUi('update')).toBe('updated')
    expect(ChangelogChangeType.toUi('delete')).toBe('deleted')
  })
})
