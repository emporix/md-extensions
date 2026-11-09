import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import DateValue from '../components/shared/DateValue'
import { DateFilterTemplate } from '../components/shared/DateFilterTemplate'
import type { LegalEntity } from '../models/LegalEntity.model'
import { useLocalizedValue } from './useLocalizedValue'
import CompanyTypeFilter from '../components/companies/CompanyTypeFilter'
import { formatCustomerName } from '../helpers/companyFormat.helpers'

export const TABLE_NAME = 'companies'

/** MD `MdColumnProps`: a column can start hidden until the user configures it. */
export type CompanyColumnProps = DataTableColumnProps & {
  defaultHidden?: boolean
}

// Per-column minimum widths (px). Keeps ID/name-like values on a single line and
// lets the table scroll horizontally instead of squeezing columns.
const COLUMN_MIN_WIDTHS: Record<string, string> = {
  id: '200px',
  name: '180px',
  type: '130px',
  primaryContact: '160px',
  groups: '180px',
  legalName: '180px',
  taxRegistrationNumber: '180px',
  registrationDate: '140px',
  createdAt: '140px',
  modifiedAt: '140px',
}

export const withMinWidth = (
  column: CompanyColumnProps
): CompanyColumnProps => {
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

const useCompaniesColumns = () => {
  const { i18n, t } = useTranslation()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()

  const groupsFilterField = `customerGroups.name.${(
    contentLanguage ?? 'en'
  ).toLowerCase()}`

  const columns: CompanyColumnProps[] = useMemo(() => {
    const baseColumns: CompanyColumnProps[] = [
      {
        columnKey: 'id',
        header: t(`${TABLE_NAME}.id`),
        field: 'id',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'name',
        header: t(`${TABLE_NAME}.name`),
        field: 'name',
        sortable: true,
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'type',
        header: t(`${TABLE_NAME}.type`),
        field: 'type',
        filter: true,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <CompanyTypeFilter options={options} />
        ),
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'countryOfRegistration',
        field: 'legalInfo.countryOfRegistration',
        filter: true,
        header: t(`${TABLE_NAME}.countryOfRegistration`),
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'primaryContact',
        header: t(`${TABLE_NAME}.primaryContact`),
        body: (rowData: LegalEntity) => {
          if (!rowData.contacts || rowData.contacts.length === 0) {
            return '-'
          }
          const primaryContact = rowData.contacts.filter(
            (contact) => contact.primary
          )[0]
          return primaryContact
            ? formatCustomerName(primaryContact.customer)
            : formatCustomerName(rowData.contacts[0].customer)
        },
      },
      {
        columnKey: 'groups',
        header: t(`${TABLE_NAME}.groups`),
        field: 'customerGroups',
        filterField: groupsFilterField,
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
        defaultHidden: true,
        body: (rowData: LegalEntity) =>
          rowData.customerGroups
            ?.map((group) => getContentLangValue(group.name))
            .join(', ') || '-',
      },
      {
        columnKey: 'legalName',
        header: t(`${TABLE_NAME}.legalName`),
        field: 'legalInfo.legalName',
        filterField: 'legalInfo.legalName',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
        defaultHidden: true,
      },
      {
        columnKey: 'registrationDate',
        header: t(`${TABLE_NAME}.registrationDate`),
        field: 'legalInfo.registrationDate',
        filterField: 'legalInfo.registrationDate',
        dataType: 'date',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        defaultHidden: true,
        body: (rowData: LegalEntity) => (
          <DateValue date={rowData.legalInfo?.registrationDate} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} selectionMode="range" />
        ),
      },
      {
        columnKey: 'createdAt',
        header: t(`${TABLE_NAME}.createdAt`),
        field: 'metadata.createdAt',
        filterField: 'metadata.createdAt',
        dataType: 'date',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        defaultHidden: true,
        body: (rowData: LegalEntity) => (
          <DateValue date={rowData.metadata?.createdAt as string | undefined} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} selectionMode="range" />
        ),
      },
      {
        columnKey: 'modifiedAt',
        header: t(`${TABLE_NAME}.modifiedAt`),
        field: 'metadata.modifiedAt',
        filterField: 'metadata.modifiedAt',
        dataType: 'date',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        defaultHidden: true,
        body: (rowData: LegalEntity) => (
          <DateValue
            date={rowData.metadata?.modifiedAt as string | undefined}
          />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} selectionMode="range" />
        ),
      },
    ]
    return baseColumns.map(withMinWidth)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, groupsFilterField])

  return { columns }
}

export default useCompaniesColumns
