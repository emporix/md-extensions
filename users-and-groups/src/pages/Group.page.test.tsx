/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '../translations/i18n'
import type { Group } from '../models/Groups.model'
import { GroupUserTypes } from '../models/Groups.model'
import GroupPage from './Group.page'

const groupData = vi.hoisted(() => ({ group: undefined as unknown }))

vi.mock('../context/Group.provider', () => ({
  useGroupData: () => ({
    group: groupData.group,
    groupType: 'EMPLOYEE',
    syncGroup: vi.fn(),
  }),
}))
vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    accessControlsForOe: [],
    accessControlsForVendor: [],
    accessControlsForEmployee: [],
    accessControlsForCustomer: [],
    templates: [],
    syncUserAccessControls: vi.fn(),
  }),
}))
vi.mock('../hooks/api/iam', () => ({
  useIamApi: () => ({ createGroup: vi.fn(), updateGroup: vi.fn() }),
}))
vi.mock('../context/UIBlcoker', () => ({
  useUIBlocker: () => ({ blockPanel: vi.fn() }),
}))
vi.mock('../hooks/useCustomNavigate', () => ({
  default: () => ({ navigate: vi.fn() }),
}))
vi.mock('../hooks/useEntraIdGroupsSync', () => ({
  useEntraIdGroupsSync: () => ({
    areManualMutationsRestricted: false,
    isEntraIdGroupsSyncEnabled: false,
  }),
}))
vi.mock('../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value?: { en?: string }) => value?.en ?? '',
  }),
}))
vi.mock('../components/group/GroupMembers', () => ({ default: () => null }))
vi.mock('../components/group/GroupAddMembersDialog', () => ({
  default: () => null,
}))
vi.mock('../components/auditLog/EntityChangelogTab', () => ({
  default: () => null,
}))
// The details tab: like GroupDetails, seed the form with the loaded group and
// render the real role type radio. The role panels load their own data; this
// test is about the radio and Discard.
vi.mock('../components/group/GroupDetails', async () => {
  const { useEffect } = await import('react')
  const { useFormContext } = await import('react-hook-form')
  const { mapGroupToGroupForm } = await import(
    '../helpers/groups/groupForm.helpers'
  )
  const { default: Roles } = await vi.importActual<
    typeof import('../components/group/GroupDetailsGeneralFormRoles')
  >('../components/group/GroupDetailsGeneralFormRoles')
  const Details = () => {
    const { reset } = useFormContext()
    useEffect(() => {
      reset(mapGroupToGroupForm(groupData.group as Group))
    }, [reset])
    return <Roles />
  }
  return { default: Details }
})
vi.mock('../components/group/GroupDetailsGeneralFormRolesStandard', () => ({
  default: () => <div>standard panel</div>,
}))
vi.mock('../components/group/GroupDetailsGeneralFormRolesTemplates', () => ({
  default: () => <div>templates panel</div>,
}))
vi.mock('../components/group/GroupDetailsGeneralFormRolesVendor', () => ({
  default: () => <div>vendor panel</div>,
}))
vi.mock(
  '../components/group/GroupDetailsGeneralFormRolesServicePicker',
  () => ({
    default: () => null,
  })
)
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return {
    ...actual,
    useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
  }
})

const standardGroup = {
  id: 'g1',
  code: 'g1',
  name: { en: 'Editors' },
  description: { en: '' },
  accessControls: ['ac:one'],
  templates: [],
  metadata: { version: 1 },
  userType: GroupUserTypes.EMPLOYEE,
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/groups/g1']}>
      <Routes>
        <Route path="/groups/:groupId" element={<GroupPage />} />
      </Routes>
    </MemoryRouter>
  )

const discardButton = () =>
  screen.getByRole('button', { name: 'Discard' }) as HTMLButtonElement

describe('Group page', () => {
  afterEach(() => cleanup())

  // COP-7405: the role type lives outside the form, so Discard restored the
  // form values but left the radio on the role type the user switched to.
  it('puts the role type back with the form values on Discard', async () => {
    groupData.group = standardGroup
    renderPage()
    await screen.findByText('standard panel')

    fireEvent.click(screen.getByRole('radio', { name: 'Templates' }))
    await screen.findByText('templates panel')
    await waitFor(() => expect(discardButton().disabled).toBe(false))

    fireEvent.click(discardButton())

    await screen.findByText('standard panel')
    expect(screen.queryByText('templates panel')).toBeNull()
    expect(discardButton().disabled).toBe(true)
  })
})
