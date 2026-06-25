import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIamApi } from '../../hooks/api/iam'
import { useToast } from '@emporix/component-library'
import { User } from '../../models/User.model'
import { Button } from 'primereact/button'
import { makeCall, getApiErrorDetails } from '../../helpers/api'
import { GroupUserTypes } from '../../models/Groups.model'
import { Dialog } from 'primereact/dialog'
import MdDataTable from '../../components/shared/MdDataTable'
import useUsersTableColumns from '../../hooks/useUsersTableColumns'
import { useGroupData } from '../../context/Group.provider'
import usePagination from '../../hooks/usePagination'

interface Props {
  visible: boolean
  onHide: () => void
  groupId: string | undefined
}

const GroupAddMembersDialog = (props: Props) => {
  const { groupId, onHide, visible = false } = props
  const { t } = useTranslation()
  const { getAllUsers, addUserToGroup } = useIamApi()
  const { showSuccess, showError } = useToast()
  const { paginationParams, onPageCallback, onFilterCallback, totalCount } =
    usePagination()
  const { columns, customerColumns } = useUsersTableColumns()
  const { groupMembers, syncMembers, isLoadingData, groupType } = useGroupData()
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAdd, setIsLoadingAdd] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  useEffect(() => {
    ;(async () => {
      await loadUsers()
    })()
  }, [groupMembers])

  const loadUsers = async () => {
    try {
      if (!groupType) return
      const allUsers = await makeCall(
        () => getAllUsers(groupType),
        setIsLoadingUsers
      )
      const filteredUsers = allUsers.values.filter((u) => {
        return !groupMembers.find((gm) => gm.id === u.id)
      })
      setUsers(filteredUsers)
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.groups.toasts.fetchUsers.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const addSingleMember = async (user: User) => {
    if (!groupId) return
    try {
      await makeCall(
        () => addUserToGroup(groupId as string, user.id, groupType),
        setIsLoadingAdd
      )
      showSuccess(
        t('usersAndGroups.groups.toasts.addMember.success', {
          name: user.firstName + ' ' + user.lastName,
        })
      )
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.groups.toasts.addMember.error', {
          name: user.firstName + ' ' + user.lastName,
        }),
        getApiErrorDetails(e)
      )
    }
  }

  const addMembers = async (users: User[]) => {
    try {
      for (const user of users) {
        await addSingleMember(user)
      }
      onHide()
    } catch (e: unknown) {
      console.error(e)
      await loadUsers()
    } finally {
      setSelectedUsers([])
      await syncMembers(groupType)
    }
  }

  return (
    <Dialog
      className="w-8"
      header={t('usersAndGroups.groups.titles.addMembers')}
      visible={visible}
      onHide={onHide}
    >
      <MdDataTable
        dataKey="id"
        value={users}
        columns={
          groupType === GroupUserTypes.CUSTOMER ? customerColumns : columns
        }
        selection={selectedUsers}
        setSelectedItems={setSelectedUsers}
        paginationOptions={{
          ...paginationParams,
          totalRecords: totalCount,
        }}
        isLoading={isLoadingUsers || isLoadingData}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        selectionMode="multiple"
      />
      <div className="flex gap-3 justify-content-center mt-5">
        <Button
          className="p-button-secondary"
          onClick={onHide}
          label={t('global.cancel')}
        />
        <Button
          loading={isLoadingAdd}
          disabled={selectedUsers.length === 0 || isLoadingAdd}
          onClick={() => addMembers(selectedUsers)}
          label={t('usersAndGroups.groups.buttons.addMembers')}
        />
      </div>
    </Dialog>
  )
}

export default GroupAddMembersDialog
