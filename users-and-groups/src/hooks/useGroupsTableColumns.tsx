import { useMemo } from 'react'
import {
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { Group } from '../models/Groups.model'
import { useLocalizedValue } from '../hooks/useLocalizedValue'

const COLUMN_PATH = 'usersAndGroups.groups.tables.groups.columns'

const useGroupsTableColumns = () => {
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  const columns: DataTableColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'name',
        header: t(`${COLUMN_PATH}.name`),
        field: 'name',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Group) => getContentLangValue(rowData.name),
      },
    ]
  }, [i18n.language, getContentLangValue])

  return { columns }
}

export default useGroupsTableColumns
