import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DotIndicator,
  Dropdown,
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { Customer } from '../models/Customer.model'
import styles from './useQuoteCustomersColumns.module.scss'

const COLUMN_PATH = 'segments.tables.customers.columns'

type ActiveOption = { label: string; value: boolean }

/** Columns of the quote's customer dialog (MD `useQuoteCustomersColumns`). */
const useQuoteCustomersTableColumns = () => {
  const { i18n, t } = useTranslation()
  const activeOptions = useMemo<ActiveOption[]>(() => {
    return [
      { label: t('global.active'), value: true },
      { label: t('global.inactive'), value: false },
    ]
  }, [t])

  const columns: DataTableColumnProps[] = useMemo(() => {
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
        columnKey: 'siteCode',
        header: t(`${COLUMN_PATH}.siteCode`),
        field: 'siteCode',
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
        // MD `DropdownFilterTemplate`: clearable, boolean option values.
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <Dropdown<ActiveOption>
            className={`${styles.statusFilter} p-column-filter`}
            value={options.value}
            showClear
            clearAriaLabel={t('global.clear')}
            placeholder=""
            options={activeOptions}
            onChange={(e) => {
              options.filterApplyCallback(e.value, options.index)
            }}
          />
        ),
        headerAlign: 'left',
        body: (rowData: Customer) => (
          <DotIndicator className={styles.dot} value={rowData.active} />
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language])

  return { columns }
}

export default useQuoteCustomersTableColumns
