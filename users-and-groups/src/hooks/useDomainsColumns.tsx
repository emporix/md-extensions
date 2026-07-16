import { useMemo } from 'react'
import {
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { AccessControlDomainGroup } from '../models/AccessControl.model'

export const TABLE_COLUMNS_PATH = 'usersAndGroups.groups.tables.accessControls'

const useDomainsColumns = () => {
  const { i18n, t } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'expander',
        expander: true,
        style: { width: '3em' },
      },
      {
        columnKey: 'name',
        header: t(`${TABLE_COLUMNS_PATH}.name`),
        field: 'name',
        filterMatchMode: FilterMatchMode.CUSTOM,
        filterFunction: () => true,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: AccessControlDomainGroup) =>
          rowData.name.startsWith('zzz') ? rowData.name.slice(3) : rowData.name,
      },
    ]
  }, [i18n.language])

  return { columns }
}

export default useDomainsColumns
