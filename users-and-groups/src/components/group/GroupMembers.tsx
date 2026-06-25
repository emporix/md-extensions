import { useCallback, useEffect, useState } from 'react'
import { makeCall, getApiErrorDetails } from '../../helpers/api'
import useUsersTableColumns from '../../hooks/useUsersTableColumns'
import { User } from '../../models/User.model'
import { GroupUserTypes } from '../../models/Groups.model'
import { useTranslation } from 'react-i18next'
import { useIamApi } from '../../hooks/api/iam'
import { useToast } from '@emporix/component-library'
import TableActions from '../../components/shared/TableActions'
import MdDataTable from '../../components/shared/MdDataTable'
import { BsXCircleFill } from 'react-icons/bs'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import GroupAddMembersDialog from './GroupAddMembersDialog'
import { useGroupData } from '../../context/Group.provider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import BatchDeleteButton from '../../components/shared/BatchDeleteButton'

const GroupMembers = () => {
  const { t } = useTranslation()
  const { deleteUserFromGroup } = useIamApi()
  const { showSuccess, showError } = useToast()
  const { getContentLangValue } = useLocalizedValue()

  const { columns, customerColumns } = useUsersTableColumns()
  const { group, groupMembers, syncMembers, isLoadingData, groupType } =
    useGroupData()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [isMembersDialogOpened, setIsMembersDialogOpened] = useState(false)
  const { hasPermission } = usePermissions()
  const [isDeleting, setIsDeleting] = useState(false)
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  useEffect(() => {
    if (!group) return
    syncMembers(groupType)
  }, [group, groupType])

  const removeSingleMember = useCallback(
    async (member: User) => {
      if (!group) return
      try {
        await makeCall(
          () => deleteUserFromGroup(group.id, member.id),
          setIsLoading
        )
        showSuccess(
          t('usersAndGroups.groups.toasts.removeMember.success', {
            name: member.firstName + ' ' + member.lastName,
          })
        )
      } catch (e: unknown) {
        console.error(e)
        showError(
          t('usersAndGroups.groups.toasts.removeMember.error', {
            name: member.firstName + ' ' + member.lastName,
          }),
          getApiErrorDetails(e)
        )
      }
    },
    [group]
  )

  const removeMembers = useCallback(
    async (members: User[]) => {
      try {
        setIsDeleting(true)
        await Promise.all(members.map((member) => removeSingleMember(member)))
      } catch (e: unknown) {
        console.error(e)
      } finally {
        setSelectedMembers([])
        setIsDeleting(false)
        await syncMembers(groupType)
      }
    },
    [removeSingleMember, groupType]
  )

  const tableActionsTemplate = useCallback(
    (member: User) => {
      const actions = [
        {
          disabled: !canManage,
          icon: <BsXCircleFill size={16} />,
          onClick: () => removeMembers([member]),
          tooltip: t(
            'usersAndGroups.groups.tables.members.actions.removeMember'
          ),
        },
      ]
      return <TableActions actions={actions} />
    },
    [removeMembers]
  )

  return (
    <>
      <BatchDeleteButton
        disabled={selectedMembers.length === 0 || !canManage}
        className="p-button-secondary mb-2"
        pluralsPath="usersAndGroups.groups.tables.members"
        selected={selectedMembers}
        isDeleting={isDeleting}
        onDelete={() => removeMembers(selectedMembers)}
      />
      <MdDataTable
        dataKey="id"
        isLoading={isLoading || isLoadingData}
        setSelectedItems={setSelectedMembers}
        value={groupMembers}
        columns={
          groupType === GroupUserTypes.CUSTOMER ? customerColumns : columns
        }
        selection={selectedMembers}
        selectionMode="multiple"
        actions={tableActionsTemplate}
        emptyText={t('usersAndGroups.groups.tables.members.emptyText', {
          name: getContentLangValue(group?.name),
        })}
        emptyButtonLabel={t('usersAndGroups.groups.buttons.addMembers')}
        emptyAction={() => setIsMembersDialogOpened(true)}
      />
      <GroupAddMembersDialog
        groupId={group?.id}
        visible={isMembersDialogOpened}
        onHide={() => setIsMembersDialogOpened(false)}
      />
    </>
  )
}

export default GroupMembers
