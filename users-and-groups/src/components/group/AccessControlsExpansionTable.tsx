import { DataTable } from '@emporix/component-library'
import { useCallback, useState } from 'react'
import type { DataTableFilterParams } from 'primereact/datatable'
import { AccessControl } from '../../models/Permissions.model'
import TableActions from '../../components/shared/TableActions'
import usePagination from '../../hooks/usePagination'
import useAccessControlsExpansionColumns from '../../hooks/useDomainsExpansionColumns'
import { useTranslation } from 'react-i18next'
import ConfirmBox from '../../components/shared/ConfirmBox'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'

interface Props {
  accessControls: AccessControl[]
  onRemove?: (accessControlId: string) => void
  selectable?: boolean
  selection?: AccessControl[]
  onSelectionChange?: (selected: AccessControl[]) => void
}

const AccessControlsExpansionTable = (props: Props) => {
  const { accessControls, onRemove, selectable, selection, onSelectionChange } =
    props
  const { i18n, t } = useTranslation()
  const { columns } = useAccessControlsExpansionColumns()
  const { getUiLangValue } = useLocalizedValue()
  const [visible, setVisible] = useState<string>()
  const { paginationParams, onFilterCallback } = usePagination(
    { sortField: 'name', sortOrder: 1, rows: 25 },
    false
  )

  const actionsTemplate = useCallback(
    (ac: AccessControl) => (
      <>
        <TableActions onDelete={() => setVisible(ac.id)} />
        <ConfirmBox
          visible={visible === ac.id}
          onAccept={() => {
            onRemove?.(ac.id)
            setVisible(undefined)
          }}
          onReject={() => setVisible(undefined)}
          title={t('usersAndGroups.groups.dialogs.unassignDomain.title')}
          message={t('usersAndGroups.groups.dialogs.unassignDomain.text', {
            name: getUiLangValue(ac.name),
          })}
        />
      </>
    ),
    [i18n.language, visible, onRemove]
  )

  return (
    <DataTable
      columns={columns}
      rowActions={onRemove ? actionsTemplate : undefined}
      value={accessControls}
      selectionMode={selectable ? 'multiple' : undefined}
      selection={selectable ? selection : undefined}
      onSelectionChange={
        selectable
          ? (selection) => onSelectionChange?.(selection as AccessControl[])
          : undefined
      }
      loading={false}
      sortField={paginationParams.sortField}
      sortOrder={paginationParams.sortOrder}
      pagination={paginationParams}
      onFilter={(event) =>
        onFilterCallback(event as unknown as DataTableFilterParams)
      }
      showFilter={false}
      paginator={false}
      showHeaders={false}
    />
  )
}

export default AccessControlsExpansionTable
