import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateValue,
  DotIndicator,
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'

import DateFilterTemplate from '../components/shared/DateFilterTemplate'
import { useLocalizedValue } from './useLocalizedValue'
import { publishedToLabel, type Catalog } from '../models/Catalog.model'

const COLUMNS = 'catalogs.table.columns'

/**
 * Column keys as MD stored them under `ext_catalogs`; the column-visibility
 * preference refers to these, not to the column fields.
 */
export const CATALOG_COLUMN_KEYS = [
  'status',
  'name',
  'publishedTo',
  'visibilityStart',
  'visibilityEnd',
  'lastPublished',
] as const

export type CatalogColumnKey = (typeof CATALOG_COLUMN_KEYS)[number]

export type CatalogColumn = DataTableColumnProps & { key: CatalogColumnKey }

const noFilterMenu: Partial<DataTableColumnProps> = {
  showFilterMenu: false,
  showClearButton: false,
}

const dateFilter = (
  filterField: string,
  showTime = false
): Partial<DataTableColumnProps> => ({
  filter: true,
  filterField,
  ...noFilterMenu,
  filterElement: (options: DataTableColumnFilterElementOptions) => (
    <DateFilterTemplate filterOptions={options} showTime={showTime} />
  ),
})

/**
 * MD's six catalog columns. Filter fields are the query params the Catalog
 * Service reads (`name.<language>`, `publishedSite`, `visibilityFrom`,
 * `visibilityTo`, `metadataUpdatedAt`).
 */
const useCatalogsTableColumns = (): CatalogColumn[] => {
  const { t, i18n } = useTranslation()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()

  return useMemo(
    () => [
      {
        key: 'status',
        columnKey: 'status',
        header: t(`${COLUMNS}.status`),
        field: 'status',
        sortable: true,
        body: (catalog: Catalog) => (
          <DotIndicator
            value={catalog.status === 'visible'}
            label={t(`${COLUMNS}.status`)}
          />
        ),
      },
      {
        key: 'name',
        columnKey: 'name',
        header: t(`${COLUMNS}.name`),
        field: 'name',
        sortable: true,
        filter: true,
        // MD filtered by the UI language while showing the content language.
        filterField: `name.${i18n.language}`,
        filterMatchMode: FilterMatchMode.CONTAINS,
        ...noFilterMenu,
        body: (catalog: Catalog) => getContentLangValue(catalog.name),
      },
      {
        key: 'publishedTo',
        columnKey: 'publishedSites',
        header: t(`${COLUMNS}.publishedTo`),
        field: 'publishedSites',
        sortable: true,
        filter: true,
        filterField: 'publishedSite',
        filterMatchMode: FilterMatchMode.CONTAINS,
        ...noFilterMenu,
        body: (catalog: Catalog) =>
          publishedToLabel(catalog.publishedSites, (size) =>
            t('catalogs.table.publishedSites', { size })
          ),
      },
      {
        key: 'visibilityStart',
        columnKey: 'validity.from',
        header: t(`${COLUMNS}.visibilityStart`),
        field: 'validity.from',
        dataType: 'date',
        ...dateFilter('visibilityFrom'),
        body: (catalog: Catalog) => (
          <DateValue date={catalog.visibility?.from} locale={i18n.language} />
        ),
      },
      {
        key: 'visibilityEnd',
        columnKey: 'validity.to',
        header: t(`${COLUMNS}.visibilityEnd`),
        field: 'validity.to',
        ...dateFilter('visibilityTo'),
        body: (catalog: Catalog) => (
          <DateValue date={catalog.visibility?.to} locale={i18n.language} />
        ),
      },
      {
        key: 'lastPublished',
        columnKey: 'metadata.updatedAt',
        header: t(`${COLUMNS}.lastPublished`),
        field: 'metadata.updatedAt',
        ...dateFilter('metadataUpdatedAt'),
        body: (catalog: Catalog) => (
          <DateValue
            date={catalog.metadata?.updatedAt}
            locale={i18n.language}
            showTime
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, contentLanguage, t]
  )
}

/**
 * The DataTable columns to show. MD rule: with no visible keys saved every
 * column shows; otherwise only the saved ones do.
 */
export const filterVisibleCatalogColumns = (
  columns: CatalogColumn[],
  visibleKeys: string[]
): DataTableColumnProps[] =>
  columns
    .filter(
      (column) => visibleKeys.length === 0 || visibleKeys.includes(column.key)
    )
    .map((column) => {
      const tableColumn: Partial<CatalogColumn> = { ...column }
      delete tableColumn.key
      return tableColumn as DataTableColumnProps
    })

export default useCatalogsTableColumns
