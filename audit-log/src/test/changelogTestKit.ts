import { createElement } from 'react'
import type {
  ChangelogEntry,
  CursorPaginatedResponse,
} from '@emporix/api-calls/next'
import type { EntityChangelogLinks } from '../EntityChangelog'
import type { EntityChangelogLabels } from '../labels'
import { defaultChangelogWindow } from '../window/changelogWindow'

/** Today in the audit-log tests: its default window is 16 Nov 00:00 to 18 Nov 23:59:59.999 local time. */
export const TEST_NOW = new Date('2026-11-18T12:00:00Z')
export const TEST_WINDOW = defaultChangelogWindow(TEST_NOW)

const ENTITY_LABELS: Record<string, string> = {
  employee: 'User',
  group: 'Group',
  'group-assignment': 'Group assignment',
}

export const TEST_LABELS: EntityChangelogLabels = {
  empty: 'No audit log entries in the selected period',
  loadError: 'The audit log could not be loaded.',
  retry: 'Try again',
  notSet: 'Not set',
  fieldColumn: 'Field',
  previousValueColumn: 'Previous Value',
  updatedValueColumn: 'Updated Value',
  windowLabel: 'Period',
  windowLimitHint: 'The period is limited to 7 days.',
  previousPage: 'Previous',
  nextPage: 'Next',
  rowsPerPage: 'Rows per page',
  changeType: (key) =>
    ({ created: 'Created', updated: 'Updated', deleted: 'Deleted' })[key],
  entity: (entity) => ENTITY_LABELS[entity] ?? entity,
}

export const TEST_LINKS: EntityChangelogLinks = {
  pathOf: (entity, entityId) =>
    entity === 'group' ? `/groups/${entityId}` : undefined,
  render: ({ to, className, title, children }) =>
    createElement('a', { href: to, className, title }, children),
}

export const changelogItem = (
  entityId: string,
  fields: Partial<ChangelogEntry> = {}
): ChangelogEntry => ({
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
): CursorPaginatedResponse<ChangelogEntry> => ({
  values: ids.map((id) => changelogItem(id)),
  nextCursor,
  prevCursor,
})
