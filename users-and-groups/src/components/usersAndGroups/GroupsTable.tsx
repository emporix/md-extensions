import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIamApi } from '../../hooks/api/iam'
import {
  DataTable,
  type DataTablePaginationState,
  useToast,
} from '@emporix/component-library'
import { makeCall, getApiErrorDetails } from '../../helpers/api'
import { Group, GroupUserTypes } from '../../models/Groups.model'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useRefresh } from '../../context/RefreshValuesProvider'
import ConfirmBox from '../../components/shared/ConfirmBox'
import useGroupsTableColumns from '../../hooks/useGroupsTableColumns'
import GroupAddMembersDialog from '../group/GroupAddMembersDialog'
import TableActions from '../../components/shared/TableActions'
import { BsPersonPlusFill } from 'react-icons/bs'
import { useLocation } from 'react-router'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { usePermissions } from '../../context/PermissionsProvider'
import BatchDeleteButton from '../../components/shared/BatchDeleteButton'
import usePagination, { PaginationProps } from '../../hooks/usePagination'
import { EmployeeDomains } from '../../configs/accessControls'

import { groupDetailPath } from '../../constants/paths'
import styles from './GroupsTable.module.scss'

interface Props {
  groupUserType: GroupUserTypes
}

const GroupsTable = (props: Props) => {
  const { groupUserType } = props
  const { t } = useTranslation()
  const { getGroups, deleteGroup } = useIamApi()
  const { showSuccess, showError } = useToast()
  const { getContentLangValue } = useLocalizedValue()
  const { refresh, setRefreshValue } = useRefresh()
  const { columns } = useGroupsTableColumns()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const [isDeleting, setIsDeleting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([])
  const [groupToForceDelete, setGroupToForceDelete] = useState<Group>()
  const [groupToAddMembers, setGroupToAddMembers] = useState<string>()

  const { currentPage, rows, sortField, sortOrder, filters } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  useEffect(() => {
    ;(async () => {
      await loadGroups(paginationParams)
    })()
    // paginationParams is a new object on every render; depend on its
    // primitive fields instead so a reference change alone doesn't refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, currentPage, rows, sortField, sortOrder, filtersKey])

  const loadGroups = async (paginationParams: Partial<PaginationProps>) => {
    try {
      const fetchedGroups = await makeCall(
        () => getGroups(paginationParams, groupUserType),
        setIsLoading
      )
      setGroups(fetchedGroups.values)
      setTotalCount(fetchedGroups.totalRecords)
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('usersAndGroups.groups.toasts.fetchGroups.error'),
        getApiErrorDetails(e)
      )
    }
  }

  const deleteGroups = async (groups: Group[], force = false) => {
    setIsLoading(true)
    setIsDeleting(true)
    let updatedGroups = [...groups]
    for (const group of groups) {
      if (!group.id) return
      try {
        await deleteGroup(group.id, force)
        updatedGroups = updatedGroups.filter((g) => g.id !== group.id)
        showSuccess(
          t('usersAndGroups.groups.toasts.deleteGroup.success', {
            name: getContentLangValue(group.name),
          })
        )
        setRefreshValue()
        if (force) {
          setGroupToForceDelete(undefined)
          if (updatedGroups.length > 0) {
            await deleteGroups(updatedGroups)
          }
        }
      } catch (e: unknown) {
        if (force) {
          console.error(e)
          showError(
            t('usersAndGroups.groups.toasts.deleteGroup.error'),
            getApiErrorDetails(e)
          )
        } else {
          setIsLoading(false)
          setGroupToForceDelete(group)
        }
      }
    }
    setSelectedGroups(updatedGroups)
    setIsLoading(false)
    setIsDeleting(false)
  }

  const tableActionsTemplate = useCallback(
    (group: Group) => {
      return (
        <TableActions
          onEdit={() =>
            navigate(groupDetailPath(group.id), {
              query: { backTo: `${location.pathname}${location.search}` },
            })
          }
          managerPermission={canManage}
          onDelete={() => deleteGroups([group])}
          deleteConfirm={{
            pluralsPath: 'usersAndGroups.groups.plurals.groups',
            entity: group,
          }}
          actions={[
            {
              icon: <BsPersonPlusFill size={16} />,
              onClick: () => setGroupToAddMembers(group.id),
              tooltip: t(
                'usersAndGroups.groups.tables.groups.actions.addMembers'
              ),
              disabled: !canManage,
            },
          ]}
        />
      )
    },
    [canManage, groupUserType]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <>
      <BatchDeleteButton
        className={styles.batchActionButton}
        selected={selectedGroups}
        onDelete={() => deleteGroups(selectedGroups)}
        isDeleting={isDeleting}
        pluralsPath="usersAndGroups.groups.plurals.groups"
        disabled={!canManage}
      />
      <DataTable
        dataKey="id"
        value={groups}
        selection={selectedGroups}
        onSelectionChange={(selection) =>
          setSelectedGroups(selection as Group[])
        }
        pagination={pagination}
        lazy={true}
        loading={isLoading}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        columns={columns}
        selectionMode="multiple"
        rowActions={tableActionsTemplate}
        onRowClick={(group) => {
          const currentPath = `${location.pathname}${location.search}`
          navigate(groupDetailPath(group.id), {
            query: { backTo: currentPath },
          })
        }}
      />
      <ConfirmBox
        visible={!!groupToForceDelete}
        onAccept={() =>
          groupToForceDelete && deleteGroups([groupToForceDelete], true)
        }
        onReject={() => setGroupToForceDelete(undefined)}
        title={t('usersAndGroups.groups.dialogs.deleteGroupForce.title')}
        message={t('usersAndGroups.groups.dialogs.deleteGroupForce.text', {
          name: getContentLangValue(groupToForceDelete?.name),
        })}
      />
      <GroupAddMembersDialog
        visible={!!groupToAddMembers}
        groupId={groupToAddMembers}
        onHide={() => setGroupToAddMembers(undefined)}
      />
    </>
  )
}

export default GroupsTable
