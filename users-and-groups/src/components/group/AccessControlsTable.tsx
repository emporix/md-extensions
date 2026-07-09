import { DataTable } from '@emporix/component-library'
import { useCallback, useMemo, useState } from 'react'
import type {
  DataTableFilterParams,
  DataTableSortParams,
} from 'primereact/datatable'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import { useFormContext } from 'react-hook-form'
import { GroupFormFields } from '../../helpers/groups/groupForm.helpers'
import { AccessControl } from '../../models/Permissions.model'
import TableActions from '../../components/shared/TableActions'
import useDomainsColumns from '../../hooks/useDomainsColumns'
import AccessControlsExpansionTable from './AccessControlsExpansionTable'
import { BsPlusLg } from 'react-icons/bs'
import { GroupUserTypes } from '../../models/Groups.model'
import { SectionTitle } from '../../components/shared/SectionBox'
import { useGroupData } from '../../context/Group.provider'
import AssignAccessControlsDialog from './AssignAccessControlsDialog'
import { useGroupRole } from '../../context/GroupRole.provider'
import { RoleType } from '../../helpers/groups/groupForm.helpers'
import usePagination from '../../hooks/usePagination'
import {
  buildDomainGroups,
  type DomainGroup,
  groupAccessControlByDomain,
} from '../../helpers/accessControls'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import ConfirmBox from '../../components/shared/ConfirmBox'
import EmptyTable from '../../components/shared/EmptyTable'
import styles from './AccessControlsTable.module.scss'

const AccessControlsTable = () => {
  const { i18n, t } = useTranslation()
  const { setValue, watch } = useFormContext<GroupFormFields>()
  const formAccessControls = watch('accessControls') ?? []
  const { columns } = useDomainsColumns()
  const { groupType, isPredefinedGroup } = useGroupData()
  const { activeRoleType, accessControlsByRole } = useGroupRole()
  const { hasPermission } = usePermissions()
  const canViewAccess = hasPermission(EmployeeDomains.ACCESS_CONTROLS_VIEWER)

  const { paginationParams, onSortCallback } = usePagination(
    { sortField: 'name', sortOrder: 1, rows: 25 },
    false
  )
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<DomainGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [visible, setVisible] = useState<string>()

  const handleRemove = useCallback(
    (accessControlId: string) => {
      const updated = formAccessControls.filter((id) => id !== accessControlId)
      setValue('accessControls', updated, { shouldDirty: true })
    },
    [formAccessControls, setValue]
  )

  const handleRemoveDomain = useCallback(
    (domainGroup: DomainGroup) => {
      const idsToRemove = new Set(domainGroup.accessControls.map((ac) => ac.id))
      const updated = formAccessControls.filter((id) => !idsToRemove.has(id))
      setValue('accessControls', updated, { shouldDirty: true })
    },
    [formAccessControls, setValue]
  )

  const handleAssign = useCallback(
    (accessControls: AccessControl[]) => {
      const newIds = accessControls.map((ac) => ac.id)
      const merged = [...new Set([...formAccessControls, ...newIds])]
      setValue('accessControls', merged, { shouldDirty: true })
    },
    [formAccessControls]
  )

  const actionsTemplate = useCallback(
    (domainGroup: DomainGroup) => (
      <>
        <TableActions onDelete={() => setVisible(domainGroup.name)} />
        <ConfirmBox
          visible={visible === domainGroup.name}
          onAccept={() => handleRemoveDomain(domainGroup)}
          onReject={() => setVisible(undefined)}
          title={t('usersAndGroups.groups.dialogs.unassignDomain.title')}
          message={t('usersAndGroups.groups.dialogs.unassignDomain.text', {
            name: domainGroup.name === 'zzzOther' ? 'Other' : domainGroup.name,
          })}
        />
      </>
    ),
    [i18n.language, visible, handleRemoveDomain]
  )

  const availableDomainGroups = useMemo(() => {
    if (!accessControlsByRole.length) return []
    const available = accessControlsByRole.filter(
      (ac) => !formAccessControls?.includes(ac.id)
    )
    return groupAccessControlByDomain(available)
  }, [formAccessControls, accessControlsByRole])

  const domainGroups = useMemo(() => {
    const groups = buildDomainGroups(accessControlsByRole, formAccessControls)
    if (!searchQuery) {
      return groups
    }
    const query = searchQuery.toLowerCase()
    return groups.filter((group) => group.name.toLowerCase().includes(query))
  }, [accessControlsByRole, formAccessControls, searchQuery])

  return (
    <>
      <SectionTitle
        className={styles.titleSpacing}
        name={t(
          groupType === GroupUserTypes.CUSTOMER
            ? 'usersAndGroups.groups.titles.customerAccessControls'
            : 'usersAndGroups.groups.titles.accessControls'
        )}
        actions={
          <PrimaryButton
            className={styles.assignButton}
            disabled={
              activeRoleType === RoleType.TEMPLATES ||
              isPredefinedGroup ||
              !canViewAccess
            }
            onClick={() => setIsAssignDialogOpen(true)}
          >
            <BsPlusLg size={16} aria-hidden />
            <span>{t('usersAndGroups.groups.buttons.assignAccessControls')}</span>
          </PrimaryButton>
        }
      />
      {!domainGroups.length ? (
        <EmptyTable
          text={
            canViewAccess
              ? t('usersAndGroups.groups.tables.accessControls.emptyText')
              : t('global.noPermissions')
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rowActions={actionsTemplate}
          value={domainGroups}
          dataKey="name"
          expandedRows={expandedRows}
          onRowToggle={setExpandedRows}
          rowExpansionTemplate={(domain: DomainGroup) => (
            <AccessControlsExpansionTable
              accessControls={domain.accessControls}
              onRemove={handleRemove}
            />
          )}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          onSort={(event) =>
            onSortCallback(event as unknown as DataTableSortParams)
          }
          showFilter
          onFilter={(event) => {
            const nameFilter = (
              event as unknown as DataTableFilterParams
            ).filters?.name
            const filterValue =
              nameFilter &&
              typeof nameFilter === 'object' &&
              'value' in nameFilter
                ? String(nameFilter.value ?? '')
                : ''
            setSearchQuery(filterValue)
          }}
        />
      )}
      <AssignAccessControlsDialog
        visible={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        availableDomains={availableDomainGroups}
        onAssign={handleAssign}
      />
    </>
  )
}

export default AccessControlsTable
