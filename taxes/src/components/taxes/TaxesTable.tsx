import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  Dropdown,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'

import {
  createRequestTracker,
  getApiErrorDetails,
  makeCall,
} from '../../helpers/api'
import { toTaxRow, type Tax, type TaxRow } from '../../models/Tax.model'
import { useTaxesApi, type TaxListQuery } from '../../hooks/api/taxes'
import { useCountries } from '../../hooks/useCountries'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import usePagination, { type PaginationProps } from '../../hooks/usePagination'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TaxClassesTable from './TaxClassesTable'
import { EmployeeDomains } from '../../configs/accessControls'
import styles from './TaxesTable.module.scss'

const COUNTRY_CODE = 'countryCode'

/** Page, country filter and sort of the table as the tax service takes them. */
const toQuery = (params: Partial<PaginationProps>): TaxListQuery => {
  const filter = params.filters?.[COUNTRY_CODE]
  const countryCode =
    filter && 'value' in filter && typeof filter.value === 'string'
      ? filter.value
      : undefined
  return {
    pageNumber: params.currentPage,
    pageSize: params.rows,
    ...(countryCode ? { countryCode } : {}),
    ...(params.sortField && params.sortOrder
      ? {
          sort: `${params.sortField}:${params.sortOrder > 0 ? 'ASC' : 'DESC'}`,
        }
      : {}),
  }
}

/**
 * Lazy table of the country tax records: the service pages, filters by
 * country code and sorts by it. A row expands to the country's tax classes.
 */
const TaxesTable = () => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.TAXES_MANAGER)
  const { tenant } = useDashboardContext()
  const { getContentLangValue } = useLocalizedValue()
  const { getTaxesPage, deleteTax } = useTaxesApi()
  const { activeCountriesDropdownOptions, getCountryLocalizedName } =
    useCountries()

  const { paginationParams, onPageCallback, onFilterCallback, onSortCallback } =
    usePagination()
  const { currentPage, rows, filters, sortField, sortOrder } = paginationParams
  const filtersKey = JSON.stringify(filters ?? null)

  const [taxes, setTaxes] = useState<Tax[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selected, setSelected] = useState<TaxRow[]>([])
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // Rows, selection and expansion belong to the previous tenant.
    setSelected([])
    setTaxes([])
    setExpandedRows({})
  }, [tenant])

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest request may fill the table.
    const isLatest = trackRequest()
    makeCall(
      () => getTaxesPage(toQuery(paginationParams)),
      (loading: boolean) => {
        if (isLatest()) setIsLoading(loading)
      }
    )
      .then(({ values, totalRecords }) => {
        if (!isLatest()) return
        setTaxes(values)
        setTotalCount(totalRecords)
      })
      .catch((e: unknown) => {
        if (!isLatest()) return
        setTaxes([])
        setTotalCount(0)
        showError(t('taxes.toast.errorFetch'), getApiErrorDetails(e))
      })
    // Depend on the pagination values, not the paginationParams object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refresh, currentPage, rows, filtersKey, sortField, sortOrder])

  const tableRows = useMemo(
    () =>
      taxes.map((tax) =>
        toTaxRow(tax, getCountryLocalizedName(tax.location.countryCode))
      ),
    [taxes, getCountryLocalizedName]
  )

  const deleteCountries = useCallback(
    async (countryCodes: string[]) => {
      setIsDeleting(true)
      blockPanel(true)
      try {
        // In parallel, as MD did; every deletion gets its own toast.
        const results = await Promise.allSettled(
          countryCodes.map((countryCode) => deleteTax(countryCode))
        )
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            showSuccess(t('taxes.toast.successTaxDelete'))
          } else {
            showError(
              t('taxes.toast.errorDelete', { code: countryCodes[index] }),
              getApiErrorDetails(result.reason)
            )
          }
        })
      } finally {
        blockPanel(false)
        setIsDeleting(false)
        setSelected([])
        // The list is read again; stale rows are never filtered locally.
        setRefreshValue()
      }
    },
    [blockPanel, deleteTax, setRefreshValue, showError, showSuccess, t]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'expander',
        expander: true,
        headerStyle: { width: '3em' },
      },
      {
        columnKey: COUNTRY_CODE,
        header: t('taxes.label.countryCode'),
        field: COUNTRY_CODE,
        filter: true,
        filterField: COUNTRY_CODE,
        filterElement: (options: {
          value?: string | null
          filterApplyCallback: (value?: string | null) => void
        }) => (
          <Dropdown
            filter
            showClear
            options={activeCountriesDropdownOptions}
            value={options.value ?? null}
            onChange={(event) =>
              options.filterApplyCallback(
                typeof event.value === 'string' ? event.value : null
              )
            }
            data-testid="taxes-country-filter"
          />
        ),
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        style: { width: '16rem' },
      },
      {
        columnKey: 'countryName',
        header: t('taxes.label.countryName'),
        field: 'countryName',
        body: (tax: TaxRow) =>
          tax.countryName
            ? getContentLangValue(tax.countryName)
            : `${tax.countryCode} - ${t('global.inactive')}`,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, activeCountriesDropdownOptions, getContentLangValue, t]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={() => deleteCountries(selected.map((r) => r.countryCode))}
          isDeleting={isDeleting}
          pluralsPath="taxes"
          disabled={!canManage}
        />
      </div>
      <DataTable
        dataKey={COUNTRY_CODE}
        value={tableRows}
        columns={columns}
        lazy={true}
        loading={isLoading}
        pagination={pagination}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        sortField={sortField}
        sortOrder={sortOrder}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(selection) => setSelected(selection as TaxRow[])}
        expandedRows={expandedRows}
        onRowToggle={(items) =>
          setExpandedRows(items as unknown as Record<string, boolean>)
        }
        rowExpansionTemplate={(tax: TaxRow) => (
          <TaxClassesTable tax={tax} onChanged={setRefreshValue} />
        )}
        rowActions={(tax: TaxRow) => (
          <TableActions
            managerPermission={canManage}
            onDelete={() => deleteCountries([tax.countryCode])}
            deleteConfirm={{ pluralsPath: 'taxes', entity: tax.countryCode }}
          />
        )}
        emptyMessage={t('global.noDataFound')}
        data-testid="taxes-table"
      />
    </>
  )
}

export default TaxesTable
