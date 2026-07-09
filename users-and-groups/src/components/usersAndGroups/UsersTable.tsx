import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  DataTableFilterParams,
  DataTableSortParams,
} from 'primereact/datatable'
import { useIamApi } from '../../hooks/api/iam'
import {
  DataTable,
  type DataTablePaginationState,
  useToast,
} from '@emporix/component-library'
import { User } from '../../models/User.model'
import { makeCall, getApiErrorDetails } from '../../helpers/api'
import TableActions from '../../components/shared/TableActions'
import { useLocation } from 'react-router'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import useUsersTableColumns from '../../hooks/useUsersTableColumns'
import { usePermissions } from '../../context/PermissionsProvider'
import BatchDeleteButton from '../../components/shared/BatchDeleteButton'
import usePagination from '../../hooks/usePagination'
import { EmployeeDomains } from '../../configs/accessControls'
import { userDetailPath } from '../../constants/paths'
import styles from './UsersTable.module.scss'

const UsersTable = () => {
  const { t } = useTranslation()
  const { getAllUsers, deleteUser } = useIamApi()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const [isDeleting, setIsDeleting] = useState(false)
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination()
  const { columns } = useUsersTableColumns()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    ;(async () => {
      await loadUsers()
    })()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await makeCall(() => getAllUsers(), setIsLoading)
      setUsers(data.values)
      setTotalCount(data.totalRecords)
    } catch (e: unknown) {
      showError(
        t('usersAndGroups.users.toasts.fetchUsers.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const deleteSingleUser = async (user: User) => {
    try {
      await deleteUser(user.id)
      showSuccess(
        t('usersAndGroups.users.toasts.deleteUser.success', {
          name: user.firstName + ' ' + user.lastName,
        })
      )
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.users.toasts.deleteUser.error', {
          name: user.firstName + ' ' + user.lastName,
        }),
        getApiErrorDetails(e)
      )
    }
  }

  const deleteUsers = async (users: User[]) => {
    setIsDeleting(true)
    setSelectedUsers([])
    setIsLoading(true)
    try {
      for (const user of users) {
        await deleteSingleUser(user)
      }
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setIsDeleting(false)
      setIsLoading(false)
      await loadUsers()
    }
  }

  const actionsTemplate = useCallback(
    (user: User) => {
      return (
        <TableActions
          onEdit={() =>
            navigate(userDetailPath(user.id), {
              query: { backTo: `${location.pathname}${location.search}` },
            })
          }
          managerPermission={canManage}
          onDelete={() => deleteUsers([user])}
          deleteConfirm={{ pluralsPath: 'usersAndGroups.users', entity: user }}
        />
      )
    },
    [canManage]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <>
      <BatchDeleteButton
        className={styles.batchActionButton}
        selected={selectedUsers}
        onDelete={() => deleteUsers(selectedUsers)}
        isDeleting={isDeleting}
        pluralsPath="usersAndGroups.users"
        disabled={!canManage}
      />
      <DataTable
        dataKey="id"
        value={users}
        columns={columns}
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        selection={selectedUsers}
        onSelectionChange={(selection) => setSelectedUsers(selection as User[])}
        loading={isLoading}
        onPage={onPageCallback}
        onFilter={(event) =>
          onFilterCallback(event as unknown as DataTableFilterParams)
        }
        onSort={(event) => onSortCallback(event as unknown as DataTableSortParams)}
        rowActions={actionsTemplate}
        selectionMode="multiple"
        onRowClick={(user) => {
          navigate(userDetailPath(user.id), {
            query: { backTo: `${location.pathname}${location.search}` },
          })
        }}
      />
    </>
  )
}

export default UsersTable
