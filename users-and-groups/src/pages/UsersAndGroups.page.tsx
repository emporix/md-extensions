import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, Tabs } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import { useTabs } from '../hooks/useTabs'
import GroupsTable from '../components/usersAndGroups/GroupsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import UsersTable from '../components/usersAndGroups/UsersTable'
import { usePermissions } from '../context/PermissionsProvider'
import { GroupUserTypes } from '../models/Groups.model'
import { EmployeeDomains } from '../configs/accessControls'
import {
  groupAddPath,
  userAddPath,
} from '../constants/paths'

const TABS = ['users', 'groups']

const UsersAndGroupsPage = () => {
  const { t } = useTranslation()
  const { activeTab, onTabChange } = useTabs(TABS, true)
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const moduleActions = useMemo(() => {
    const isUserTab = activeTab === 'users'
    const key = isUserTab ? 'createUser' : 'createGroup'
    return (
      <PrimaryButton
        disabled={!canManage}
        onClick={() =>
          navigate(isUserTab ? userAddPath() : groupAddPath())
        }
      >
        {t(`usersAndGroups.buttons.${key}`)}
      </PrimaryButton>
    )
  }, [activeTab, canManage, navigate, t])

  const tabs = useMemo(
    () => [
      {
        id: 'users',
        label: t('usersAndGroups.tabs.users'),
        content: <UsersTable />,
      },
      {
        id: 'groups',
        label: t('usersAndGroups.tabs.groups'),
        content: <GroupsTable groupUserType={GroupUserTypes.EMPLOYEE} />,
      },
    ],
    [t]
  )

  return (
    <div className="w-full">
      <HeaderSection
        title={t('usersAndGroups.titles.main')}
        moduleActions={moduleActions}
      />
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? 'users'}
        onTabChange={onTabChange}
      />
    </div>
  )
}

export default UsersAndGroupsPage
