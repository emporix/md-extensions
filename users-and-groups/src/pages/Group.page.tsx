import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import { Tabs } from '@emporix/component-library'
import {
  createGroupForm,
  GroupFormFields,
} from '../helpers/groups/groupForm.helpers'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useTabs } from '../hooks/useTabs'
import HeaderSection from '../components/shared/HeaderSection'
import { listPath } from '../constants/paths'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import GroupMembers from '../components/group/GroupMembers'
import GroupPageActions from '../components/group/GroupPageActions'
import GroupDetails from '../components/group/GroupDetails'
import { useGroupData } from '../context/Group.provider'
import { usePermissions } from '../context/PermissionsProvider'
import { GroupRoleProvider } from '../context/GroupRole.provider'
import { EmployeeDomains } from '../configs/accessControls'

const TABS = ['details', 'members']

const GroupPage = () => {
  const { t } = useTranslation()
  const methods = useForm<GroupFormFields>({ defaultValues: createGroupForm() })
  const { activeTab, onTabChange } = useTabs(TABS, false)
  const { navigate } = useCustomNavigate()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const { groupId } = useParams()
  const { group } = useGroupData()

  const tabs = useMemo(
    () => [
      {
        id: 'details',
        label: t('usersAndGroups.groups.tabs.details'),
        content: (
          <GroupRoleProvider>
            <GroupDetails />
          </GroupRoleProvider>
        ),
      },
      {
        id: 'members',
        label: t('usersAndGroups.groups.tabs.members'),
        content: <GroupMembers />,
        disabled: !group,
      },
    ],
    [group, t]
  )

  const visibleTabs = tabs.filter((tab) => !tab.disabled)

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('usersAndGroups.groups.plurals.groups.singular')}
        subtitle={groupId ? getContentLangValue(group?.name) : undefined}
        backTo={() => navigate(listPath('groups'))}
        moduleActions={
          <GroupPageActions
            activeTab={activeTab}
            managerPermissions={canManage}
          />
        }
      />
      <Tabs
        tabs={visibleTabs}
        activeTabId={activeTab ?? 'details'}
        onTabChange={onTabChange}
      />
    </FormProvider>
  )
}

export default GroupPage
