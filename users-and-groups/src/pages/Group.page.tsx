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
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import { AUDIT_LOG_FEATURE_TOGGLE } from '../configs/auditLog.config'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import EntraIdSyncBanner from '../components/shared/EntraIdSyncBanner'

const BASE_TABS = ['details', 'members']

const GroupPage = () => {
  const { t } = useTranslation()
  const methods = useForm<GroupFormFields>({
    defaultValues: createGroupForm(),
    mode: 'onChange',
  })
  const toggles = useFeatureToggles()
  const tabIds = useMemo(
    () =>
      toggles.isToggleValid(AUDIT_LOG_FEATURE_TOGGLE)
        ? [...BASE_TABS, 'audit-log']
        : BASE_TABS,
    [toggles]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)
  const { navigate } = useCustomNavigate()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const { groupId } = useParams()
  const { group } = useGroupData()

  // Keep details mounted across GroupPage re-renders (form dirty updates,
  // i18n, toggles). Remounting GroupDetails would reset() and clear isDirty.
  const detailsContent = useMemo(
    () => (
      <GroupRoleProvider>
        <GroupDetails />
      </GroupRoleProvider>
    ),
    []
  )

  const membersContent = useMemo(() => <GroupMembers />, [])

  const tabs = useMemo(
    () => [
      {
        id: 'details',
        label: t('usersAndGroups.groups.tabs.details'),
        content: detailsContent,
      },
      {
        id: 'members',
        label: t('usersAndGroups.groups.tabs.members'),
        content: membersContent,
        disabled: !group,
      },
      ...(toggles.isToggleValid(AUDIT_LOG_FEATURE_TOGGLE)
        ? [
            {
              id: 'audit-log',
              label: t('auditLog.entityChangelog.tab'),
              disabled: !group,
              content:
                groupId && group ? (
                  <EntityChangelogTab
                    entity="group"
                    entityId={groupId}
                    isActive={activeTab === 'audit-log'}
                  />
                ) : null,
            },
          ]
        : []),
    ],
    [activeTab, detailsContent, group, groupId, membersContent, t, toggles]
  )

  const visibleTabs = tabs.filter((tab) => !tab.disabled)

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('usersAndGroups.groups.plurals.groups.singular')}
        subtitle={groupId ? getContentLangValue(group?.name) : undefined}
        backTo={() => navigate(listPath('groups'))}
        moduleActions={
          activeTab !== 'audit-log' ? (
            <GroupPageActions
              activeTab={activeTab}
              managerPermissions={canManage}
            />
          ) : undefined
        }
      />
      <EntraIdSyncBanner />
      <Tabs
        tabs={visibleTabs}
        activeTabId={activeTab ?? 'details'}
        onTabChange={onTabChange}
      />
    </FormProvider>
  )
}

export default GroupPage
