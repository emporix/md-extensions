import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIamApi } from '../../hooks/api/iam'
import {
  DataTable,
  Dialog,
  PrimaryButton,
  SecondaryButton,
  type DataTablePaginationState,
  useToast,
} from '@emporix/component-library'
import { User } from '../../models/User.model'
import { makeCall, getApiErrorDetails } from '../../helpers/api'
import { GroupUserTypes } from '../../models/Groups.model'
import useUsersTableColumns from '../../hooks/useUsersTableColumns'
import { useGroupData } from '../../context/Group.provider'
import usePagination from '../../hooks/usePagination'
import styles from './GroupAddMembersDialog.module.scss'

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
  const { paginationParams, onPageCallback, onFilterCallback } = usePagination(
    undefined,
    false
  )
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

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: users.length,
  }

  return (
    <Dialog
      className={styles.dialog}
      header={t('usersAndGroups.groups.titles.addMembers')}
      visible={visible}
      onHide={onHide}
    >
      <DataTable
        dataKey="id"
        value={users}
        columns={
          groupType === GroupUserTypes.CUSTOMER ? customerColumns : columns
        }
        selection={selectedUsers}
        onSelectionChange={(selection) => setSelectedUsers(selection as User[])}
        pagination={pagination}
        loading={isLoadingUsers || isLoadingData}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        selectionMode="multiple"
      />
      <div className={styles.footerActions}>
        <SecondaryButton onClick={onHide}>{t('global.cancel')}</SecondaryButton>
        <PrimaryButton
          loading={isLoadingAdd}
          disabled={selectedUsers.length === 0 || isLoadingAdd}
          onClick={() => addMembers(selectedUsers)}
        >
          {t('usersAndGroups.groups.buttons.addMembers')}
        </PrimaryButton>
      </div>
    </Dialog>
  )
}

export default GroupAddMembersDialog
