/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '../../models/Groups.model'
import { GroupUserTypes } from '../../models/Groups.model'
import '../../translations/i18n'
import GroupsTable from './GroupsTable'

const listedGroups = vi.hoisted(() => ({ value: [] as Group[] }))

vi.mock('../../hooks/api/iam', () => ({
  useIamApi: () => ({
    getGroups: vi.fn(async () => ({
      values: listedGroups.value,
      totalRecords: listedGroups.value.length,
    })),
    deleteGroup: vi.fn(),
  }),
}))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))

vi.mock('../../context/RefreshValuesProvider', () => ({
  useRefresh: () => ({ refresh: 0, setRefreshValue: vi.fn() }),
}))

vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value: { en?: string } | undefined) =>
      value?.en ?? '',
  }),
}))

vi.mock('../../hooks/useCustomNavigate', () => ({
  default: () => ({ navigate: vi.fn() }),
}))

vi.mock('../group/GroupAddMembersDialog', () => ({
  default: () => null,
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return {
    ...actual,
    useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
    DataTable: ({
      value,
      rowActions,
      onSelectionChange,
    }: {
      value: Group[]
      rowActions: (row: Group) => React.ReactNode
      onSelectionChange: (selection: Group[]) => void
    }) => (
      <div>
        <button type="button" onClick={() => onSelectionChange(value)}>
          Select rows
        </button>
        {value.map((row) => (
          <div key={row.id} data-testid={`row-${row.id}`}>
            {rowActions(row)}
          </div>
        ))}
      </div>
    ),
  }
})

afterEach(() => {
  listedGroups.value = []
  cleanup()
})

function group(id: string, code?: string): Group {
  return {
    id,
    code: code ?? '',
    name: { en: id },
    description: { en: '' },
    accessControls: [],
    templates: [],
    metadata: { version: 1 },
    userType: GroupUserTypes.CUSTOMER,
  }
}

async function renderList(groups: Group[]) {
  listedGroups.value = groups
  render(
    <MemoryRouter>
      <GroupsTable groupUserType={GroupUserTypes.CUSTOMER} />
    </MemoryRouter>
  )
  await screen.findByRole('button', { name: 'Select rows' })
}

function rowDelete(id: string) {
  const button = screen
    .getAllByRole('button', { name: 'Delete' })
    .find((candidate) => candidate.closest(`[data-testid="row-${id}"]`))
  if (!button) {
    throw new Error(`Missing delete button for ${id}`)
  }
  return button
}

describe('customer groups list delete', () => {
  it('keeps delete inactive when the selection includes the Customers group', async () => {
    await renderList([group('customers', 'customer'), group('custom', 'VIP')])

    expect(rowDelete('customers')).toHaveProperty('disabled', true)
    expect(rowDelete('custom')).toHaveProperty('disabled', false)

    fireEvent.click(screen.getByRole('button', { name: 'Select rows' }))

    expect(screen.getByRole('button', { name: 'Delete (2)' })).toHaveProperty(
      'disabled',
      true
    )
  })

  it('keeps delete active for ordinary groups and an employee system code', async () => {
    await renderList([group('vip', ''), group('admin', 'BO_ADMIN')])

    expect(rowDelete('vip')).toHaveProperty('disabled', false)
    expect(rowDelete('admin')).toHaveProperty('disabled', false)

    fireEvent.click(screen.getByRole('button', { name: 'Select rows' }))

    expect(screen.getByRole('button', { name: 'Delete (2)' })).toHaveProperty(
      'disabled',
      false
    )
  })
})
