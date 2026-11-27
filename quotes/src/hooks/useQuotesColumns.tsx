import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateValue,
  Dropdown,
  FilterMatchMode,
  MoneyValue,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { Quote, QuoteStatus } from '../models/Quotes.model'
import { numericColumn } from '../components/shared/NumericColumn'
import NumberFilterTemplate from '../components/shared/NumberFilterTemplate'
import { DateFilterTemplate } from '../components/shared/DateFilterTemplate'
import QuoteStatusBadge from '../components/quotes/QuoteStatusBadge'
import styles from './useQuotesColumns.module.scss'

export const TABLE_NAME = 'quotes.table'

type StatusOption = { label: string; value: QuoteStatus }

const statusTemplate = (option: StatusOption | null) =>
  option ? <QuoteStatusBadge status={option.value} /> : null

/** Base columns of the quotes list, before visibility and mixin columns. */
const useQuotesColumns = () => {
  const { t, i18n } = useTranslation()

  // The other columns get their width from their filters (180px and more), so
  // without a minimum the table squeezed these two. With it the table scrolls
  // sideways instead, as the orders and products lists do: a company name may
  // wrap, the quote number stays on one line (orders id, products list name).
  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'company.name',
        header: t(`${TABLE_NAME}.company`),
        filterField: 'company.name',
        filterMatchMode: FilterMatchMode.CONTAINS,
        field: 'company.name',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        columnKey: '_id',
        header: t(`${TABLE_NAME}.quoteNumber`),
        field: 'id',
        filter: true,
        filterField: 'id',
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '160px' },
        style: { whiteSpace: 'nowrap' },
      },
      {
        columnKey: 'metadata.createdAt',
        header: t(`${TABLE_NAME}.creationDate`),
        field: 'metadata.createdAt',
        filter: true,
        filterField: 'metadata.createdAt',
        dataType: 'date',
        filterMatchMode: FilterMatchMode.EQUALS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Quote) => (
          <DateValue
            date={rowData.metadata.createdAt as string}
            locale={i18n.language}
          />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
      },
      {
        columnKey: 'totalPrice.grossValue',
        header: t(`${TABLE_NAME}.totalPrice`),
        field: 'totalPrice.grossValue',
        filter: true,
        filterField: 'totalPrice.grossValue',
        sortable: true,
        ...numericColumn,
        headerStyle: { minWidth: '190px' },
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <NumberFilterTemplate filterOptions={options} decimalPlaces={2} />
        ),
        body: (rowData: Quote) => {
          return (
            <MoneyValue
              currency={rowData.totalPrice.currency}
              value={rowData.totalPrice.grossValue}
              locale={i18n.language}
            />
          )
        },
      },
      {
        columnKey: 'status.value',
        header: t(`${TABLE_NAME}.status`),
        field: 'status',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        filterField: 'status.value',
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Quote) => {
          return <QuoteStatusBadge status={rowData.status.value} />
        },
        filterElement: (options: DataTableColumnFilterElementOptions) => {
          return (
            <Dropdown<StatusOption>
              className={`${styles.statusFilter} p-column-filter`}
              value={options.value}
              // Named options; the filter still sends the API status code.
              options={Object.values(QuoteStatus).map((status) => {
                return {
                  label: t(`quotes.status.${status}`, {
                    defaultValue: status,
                  }),
                  value: status,
                }
              })}
              valueTemplate={statusTemplate}
              onChange={(e) => options.filterApplyCallback(e.value)}
              itemTemplate={statusTemplate}
              // No placeholder: with a value template CL renders that (empty)
              // when nothing is selected, so MD's "Select One" never showed.
              showClear
              clearAriaLabel={t('global.clear')}
              data-testid="quotes-status-filter"
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language]
  )

  return { columns }
}

export default useQuotesColumns
