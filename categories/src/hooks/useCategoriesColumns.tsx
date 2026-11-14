import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateValue,
  DotIndicator,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { DateFilterTemplate } from '../components/shared/DateFilterTemplate'
import DropdownFilterTemplate from '../components/shared/DropdownFilter'
import { useLocalizedValue } from './useLocalizedValue'
import { Category } from '../models/Category.model'

export const TABLE_COLUMNS_PATH = 'categories.table'

// Per-column minimum widths (px). Keeps ID-like values on a single line and
// lets the table scroll horizontally instead of squeezing columns.
const COLUMN_MIN_WIDTHS: Record<string, string> = {
  id: '225px',
  published: '110px',
  localizedName: '200px',
  code: '150px',
  localizedSlug: '150px',
  'validity.from': '140px',
  'validity.to': '140px',
}

const withMinWidth = (column: DataTableColumnProps): DataTableColumnProps => {
  const minWidth = COLUMN_MIN_WIDTHS[column.columnKey ?? '']
  if (!minWidth) {
    return column
  }
  return {
    ...column,
    headerStyle: { minWidth, ...(column.headerStyle ?? {}) },
    bodyStyle: { minWidth, whiteSpace: 'nowrap', ...(column.bodyStyle ?? {}) },
  }
}

/** Ported from management-dashboard `modules/categories/hooks/useCategoriesColumns`. */
const useCategoriesColumns = () => {
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  const columns = useMemo<DataTableColumnProps[]>(() => {
    const publishedOptions = [
      { label: t('global.true'), value: true as unknown as string },
      { label: t('global.false'), value: false as unknown as string },
    ]
    const baseColumns: DataTableColumnProps[] = [
      {
        columnKey: 'id',
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: 'contains',
        header: t(`${TABLE_COLUMNS_PATH}.id`),
        field: 'id',
        sortable: false,
      },
      {
        columnKey: 'published',
        header: t(`${TABLE_COLUMNS_PATH}.published`),
        field: 'published',
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (category: Category) => (
          <DotIndicator value={category.published} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, publishedOptions),
      },
      {
        columnKey: 'localizedName',
        header: t(`${TABLE_COLUMNS_PATH}.name`),
        field: 'localizedName',
        filterField: 'localizedName',
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: 'contains',
        sortable: true,
        body: (category: Category) => (
          <span>{getContentLangValue(category.localizedName)}</span>
        ),
      },
      {
        columnKey: 'code',
        header: t(`${TABLE_COLUMNS_PATH}.code`),
        field: 'code',
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: 'contains',
        sortable: true,
      },
      {
        columnKey: 'localizedSlug',
        header: t(`${TABLE_COLUMNS_PATH}.slug`),
        field: 'localizedSlug',
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: 'contains',
        sortable: true,
        body: (category: Category) => (
          <span>{getContentLangValue(category.localizedSlug)}</span>
        ),
      },
      {
        columnKey: 'validity.from',
        header: t(`${TABLE_COLUMNS_PATH}.validity.from`),
        field: 'validity.from',
        filterField: 'validityFrom',
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        sortable: true,
        dataType: 'date',
        body: (category: Category) => (
          <DateValue
            date={category.validity?.from}
            nullText={t('global.always')}
          />
        ),
      },
      {
        columnKey: 'validity.to',
        header: t(`${TABLE_COLUMNS_PATH}.validity.to`),
        field: 'validity.to',
        filterField: 'validityTo',
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
        sortable: true,
        body: (category: Category) => (
          <DateValue
            date={category.validity?.to}
            nullText={t('global.always')}
          />
        ),
      },
    ]
    return baseColumns.map(withMinWidth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, getContentLangValue])

  return { columns }
}

export default useCategoriesColumns
