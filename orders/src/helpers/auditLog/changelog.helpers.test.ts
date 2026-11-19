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

import { ChangelogChangeType } from './changelog.helpers'

describe('ChangelogChangeType', () => {
  it('maps API change types to UI values', () => {
    expect(ChangelogChangeType.toUi('create')).toBe('created')
    expect(ChangelogChangeType.toUi('update')).toBe('updated')
    expect(ChangelogChangeType.toUi('delete')).toBe('deleted')
  })
})
