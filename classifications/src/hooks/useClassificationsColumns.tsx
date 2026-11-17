import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import DateValue from '../components/shared/DateValue'
import { DateFilterTemplate } from '../components/shared/DateFilterTemplate'
import { useLocalizedValue } from './useLocalizedValue'
import { Category } from '../models/Category.model'

export const TABLE_COLUMNS_PATH = 'classifications.tables.classifications'

/**
 * Ported from management-dashboard
 * `modules/classifications/hooks/useClassificationsColumns`.
 */
const useClassificationsColumns = () => {
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  const columns = useMemo<DataTableColumnProps[]>(
    () => [
      {
        columnKey: 'name',
        header: t(`${TABLE_COLUMNS_PATH}.name`),
        field: 'localizedName',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (classification: Category) =>
          getContentLangValue(classification.localizedName),
      },
      {
        columnKey: 'validFrom',
        header: t(`${TABLE_COLUMNS_PATH}.validFrom`),
        field: 'validity.from',
        filter: true,
        dataType: 'date',
        filterMatchMode: FilterMatchMode.EQUALS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (classification: Category) => (
          <DateValue date={classification.validity?.from} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
      },
      {
        columnKey: 'validTo',
        header: t(`${TABLE_COLUMNS_PATH}.validTo`),
        field: 'validity.to',
        filter: true,
        dataType: 'date',
        filterMatchMode: FilterMatchMode.EQUALS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (classification: Category) => (
          <DateValue date={classification.validity?.to} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, getContentLangValue]
  )

  return { columns }
}

export default useClassificationsColumns
