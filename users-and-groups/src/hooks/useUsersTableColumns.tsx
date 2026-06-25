import { useMemo } from 'react'
import { ColumnProps } from 'primereact/column'
import { FilterMatchMode } from 'primereact/api'
import { User } from '../models/User.model'
import { DotIndicator } from '../components/shared/DotIndicator'
import { useTranslation } from 'react-i18next'
import DropdownFilterTemplate from '../components/shared/DropdownFilter'

const COLUMN_PATH = 'usersAndGroups.users.tables.users.columns'

const useUsersTableColumns = () => {
  const { i18n, t } = useTranslation()
  const activeOptions = useMemo(() => {
    return [
      { label: t('global.active'), value: 'ACTIVE' },
      { label: t('global.inactive'), value: 'PROVISIONED' },
    ]
  }, [t])

  const activeCustomerOptions = useMemo(() => {
    return [
      { label: t('global.active'), value: 'ACTIVE' },
      { label: t('global.inactive'), value: 'INACTIVE' },
    ]
  }, [t])

  const customerColumns: ColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'firstName',
        header: t(`${COLUMN_PATH}.firstName`),
        field: 'firstName',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'lastName',
        header: t(`${COLUMN_PATH}.lastName`),
        field: 'lastName',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'email',
        header: t(`${COLUMN_PATH}.email`),
        field: 'contactEmail',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'status',
        header: t(`${COLUMN_PATH}.status`),
        field: 'status',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options) =>
          DropdownFilterTemplate(options, activeCustomerOptions),
        headerAlign: 'left',
        body: (rowData: User) => (
          <DotIndicator
            className="mx-auto"
            value={rowData.status === 'ACTIVE'}
          />
        ),
      },
    ]
  }, [i18n.language])

  const columns: ColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'firstName',
        header: t(`${COLUMN_PATH}.firstName`),
        field: 'firstName',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'lastName',
        header: t(`${COLUMN_PATH}.lastName`),
        field: 'lastName',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'email',
        header: t(`${COLUMN_PATH}.email`),
        field: 'contactEmail',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'department',
        header: t(`${COLUMN_PATH}.department`),
        field: 'department',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'status',
        header: t(`${COLUMN_PATH}.status`),
        field: 'status',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options) =>
          DropdownFilterTemplate(options, activeOptions),
        headerAlign: 'left',
        body: (rowData: User) => (
          <DotIndicator
            className="mx-auto"
            value={rowData.status === 'ACTIVE'}
          />
        ),
      },
    ]
  }, [i18n.language])

  return { columns, customerColumns }
}

export default useUsersTableColumns
