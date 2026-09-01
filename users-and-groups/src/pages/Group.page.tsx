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
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import EntraIdSyncBanner from '../components/shared/EntraIdSyncBanner'

const GroupPage = () => {
  const { t } = useTranslation()
  const methods = useForm<GroupFormFields>({
    defaultValues: createGroupForm(),
    mode: 'onChange',
  })
  const { navigate } = useCustomNavigate()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)

  const tabIds = useMemo(
    () =>
      canViewAuditLog
        ? ['details', 'members', 'audit-log']
        : ['details', 'members'],
    [canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  const { groupId } = useParams()
  const { group } = useGroupData()

  // Keep details mounted across GroupPage re-renders (form dirty updates,
  // i18n). Remounting GroupDetails would reset() and clear isDirty.
  const detailsContent = useMemo(
    () => (
      <GroupRoleProvider>
        <GroupDetails />
      </GroupRoleProvider>
    ),
    []
  )

  const membersContent = useMemo(() => <GroupMembers />, [])

  const tabs = useMemo(() => {
    const baseTabs = [
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
    ]

    if (!canViewAuditLog) {
      return baseTabs
    }

    return [
      ...baseTabs,
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
  }, [
    activeTab,
    canViewAuditLog,
    detailsContent,
    group,
    groupId,
    membersContent,
    t,
  ])

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
