import { vi } from 'vitest'
import type { CursorPaginatedResponse } from '@emporix/api-calls/next'
import type { ChangelogItem } from '../models/Changelog.model'
import type { ChangelogCursorPage } from '../hooks/useChangelogCursorPage'
import { defaultChangelogWindow } from '../helpers/auditLog/changelogWindow.helpers'

/** Today in the audit-log tests: its default window is 2026-11-16T00:00Z to 2026-11-18T23:59:59.999Z. */
export const TEST_NOW = new Date('2026-11-18T12:00:00Z')
export const TEST_WINDOW = defaultChangelogWindow(TEST_NOW)

export const changelogItem = (
  entityId: string,
  fields: Partial<ChangelogItem> = {}
): ChangelogItem => ({
  at: '2026-11-18T10:00:00.000Z',
  type: 'update',
  entity: 'company',
  entityId,
  ...fields,
})

export const changelogPage = (
  ids: string[],
  nextCursor: string | null = null,
  prevCursor: string | null = null
): CursorPaginatedResponse<ChangelogItem> => ({
  values: ids.map((id) => changelogItem(id)),
  nextCursor,
  prevCursor,
})

/** What `useChangelogCursorPage` returns, for a component test that stubs the hook. */
export const cursorPageState = (
  state: Partial<ChangelogCursorPage> = {}
): ChangelogCursorPage => ({
  items: [],
  status: 'ready',
  nextCursor: null,
  prevCursor: null,
  goNext: vi.fn(),
  goPrev: vi.fn(),
  retry: vi.fn(),
  ...state,
})
