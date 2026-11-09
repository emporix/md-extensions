import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  FilterMatchMode,
  useDataTablePagination,
  useToast,
  type DataTableColumnProps,
  type DataTableFilterMeta,
} from '@emporix/component-library'
import { LegalEntity } from '../../models/LegalEntity.model'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { formatCustomerName } from '../../helpers/companyFormat.helpers'
import { getApiErrorDetails } from '../../helpers/api'
import { TABLE_NAME, withMinWidth } from '../../hooks/useCompaniesColumns'
import { LegalEntityActions } from './LegalEntityActions'
import { useRefresh } from '../../context/RefreshValuesProvider'

// Client-side filters (MD MdDataTable with `filter` columns, non-lazy).
const INITIAL_FILTERS: DataTableFilterMeta = {
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  'legalInfo.countryOfRegistration': {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  'legalInfo.taxRegistrationNumber': {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
}

export const Subsidiaries = (props: {
  readonly legalEntity: Partial<LegalEntity>
  /** Without Companies Manager, row delete is unavailable (Scenario 3). */
  readonly managerPermissions?: boolean
}) => {
  const { getSubsidiaries } = useCustomerManagementApi()
  const { legalEntity, managerPermissions = true } = props
  const { refresh } = useRefresh()
  const { t, i18n } = useTranslation()
  const [subsidiaries, setSubsidiaries] = useState<LegalEntity[]>([])
  const { showError } = useToast()
  const { paginationParams, onPageCallback, onSortCallback } =
    useDataTablePagination()
  const [filters, setFilters] = useState<DataTableFilterMeta>(INITIAL_FILTERS)

  useEffect(() => {
    let current = true
    ;(async () => {
      if (legalEntity?.id) {
        try {
          const { values } = await getSubsidiaries(legalEntity.id, true)
          if (current) setSubsidiaries(values as unknown as LegalEntity[])
        } catch (e: unknown) {
          if (!current) return
          showError(t('companies.toasts.errorLoad'), getApiErrorDetails(e))
          console.error('Error loading subsidiaries:', e)
        }
      }
    })()
    return () => {
      current = false
    }
    // The tab stays mounted (`keepMounted`) and `legalEntity` is the live
    // form, so depend on its id (and the refresh after a subsidiary delete),
    // not on the object: one request per company, not per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, legalEntity?.id, refresh])

  // Same filter row as the companies list: full-width text filters without
  // a clear button, and the list's column widths.
  const columns = useMemo<DataTableColumnProps[]>(
    () =>
      [
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
          columnKey: 'countryOfRegistration',
          field: 'legalInfo.countryOfRegistration',
          header: t(`${TABLE_NAME}.countryOfRegistration`),
          sortable: true,
          filter: true,
          showFilterMenu: false,
          showClearButton: false,
        },
        {
          columnKey: 'taxRegistrationNumber',
          field: 'legalInfo.taxRegistrationNumber',
          header: t(`${TABLE_NAME}.taxRegistrationNumber`),
          sortable: true,
          filter: true,
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
      ].map(withMinWidth),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt per language
    [i18n.language]
  )

  return (
    <DataTable
      data-testid="subsidiaries-table"
      dataKey="id"
      value={subsidiaries}
      columns={columns}
      pagination={{ ...paginationParams, filters }}
      onPage={onPageCallback}
      onSort={onSortCallback}
      onFilter={(event) => setFilters(event.filters)}
      rowActions={(rowData: LegalEntity) => (
        <LegalEntityActions
          legalEntity={rowData}
          managerPermissions={managerPermissions}
        />
      )}
    />
  )
}
