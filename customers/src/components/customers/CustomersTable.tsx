import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import TableActions from '../shared/TableActions'
import usePagination from '../../hooks/usePagination'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useCustomerApi } from '../../hooks/api/customers'
import { useUIBlocker } from '../../context/UIBlocker'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { createRequestTracker, loadLatest } from '../../helpers/api'
import { parseTableColumns } from '../../helpers/tables'
import type { StylableProps } from '../../helpers/props'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import type { Customer } from '../../models/Customer.model'
import { SchemaType } from '../../models/Schema.model'
import { customerDetailPath } from '../../constants/paths'
import styles from './CustomersTable.module.scss'

export const TABLE_NAME = 'customers'
/** Configuration key the column-visibility preference is stored under (MD). */
export const TABLE_NAME_CONFIG_KEY = 'ext_customers'

/** MD list defaults: 10 rows, newest first. */
const INITIAL_PAGINATION = {
  currentPage: 1,
  rows: 10,
  first: 0,
  sortOrder: -1 as const,
  sortField: 'metadataCreatedAt',
  rowsPerPageOptions: [10, 25, 50, 100],
}

/**
 * MD refreshes the list 500 ms after a delete ("temporary setTimeout solution
 * till API will fix"): an immediate reload can still return the customer.
 */
export const REFRESH_AFTER_DELETE_MS = 500

type CustomersTableProps = StylableProps & {
  readonly canManage: boolean
}

const TEXT_COLUMNS = [
  'id',
  'firstName',
  'lastName',
  'contactEmail',
  'preferredSite',
] as const

/** Port of the table in MD `modules/Customers.module.tsx`. */
const CustomersTable = ({ canManage, className = '' }: CustomersTableProps) => {
  const { i18n, t } = useTranslation()
  const {
    paginationParams,
    totalCount,
    onPageCallback,
    onFilterCallback,
    onSortCallback,
    setFilters,
    setTotalCount,
  } = usePagination(INITIAL_PAGINATION)
  const { getTableMixinColumns, tableConfigurations, fetchTableConfiguration } =
    useConfiguration()
  const { getUiLangValue } = useLocalizedValue()
  const [selected, setSelected] = useState<Customer[]>([])
  const [tableData, setTableData] = useState<Customer[]>([])
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { navigate } = useCustomNavigate()
  const { blockPanel } = useUIBlocker()
  const { tenant } = useDashboardContext()
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )
  const { syncCustomers, deleteCustomer } = useCustomerApi()
  const [isLoading, setIsLoading] = useState(true)
  const { showSuccess, showError } = useToast()
  const trackRequest = useRef(createRequestTracker()).current
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(refreshTimer.current), [])

  const invalidateCustomers = useCallback(() => {
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(
      () => setRefreshKey(Date.now()),
      REFRESH_AFTER_DELETE_MS
    )
  }, [])

  useEffect(() => {
    setVisibleColumns(fetchTableConfiguration(TABLE_NAME_CONFIG_KEY))
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [tableConfigurations])

  // A host tenant switch drops rows and selection from the previous tenant.
  useEffect(() => {
    setTableData([])
    setSelected([])
  }, [tenant])

  useEffect(() => {
    setIsLoading(true)
    void loadLatest(
      trackRequest,
      () => syncCustomers(paginationParams),
      ({ values, totalRecords }) => {
        setTableData(values as Customer[])
        setTotalCount(totalRecords)
        setIsLoading(false)
      },
      (e) => {
        // MD logs only: a viewer-less user simply sees an empty list.
        console.error(e)
        setIsLoading(false)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [paginationParams, refreshKey, tenant])

  const deleteSingle = useCallback(
    async (customerId: string) => {
      try {
        await deleteCustomer(customerId)
        setSelected((current) => current.filter((c) => c.id !== customerId))
        showSuccess(t('customers.toasts.successDelete'))
        invalidateCustomers()
      } catch (e) {
        console.error(e)
        showError(t('customers.toasts.errorDelete'))
      }
    },
    [deleteCustomer, invalidateCustomers, showError, showSuccess, t]
  )

  const batchDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeleting(true)
      await Promise.all(
        selected
          .map((customer) => customer.id)
          .filter((id): id is string => Boolean(id))
          .map((id) => deleteCustomer(id))
      )
      showSuccess(t('customers.toasts.successDelete'))
    } catch (e) {
      console.error(e)
      showError(t('customers.toasts.errorDelete'))
    } finally {
      blockPanel(false)
      setIsDeleting(false)
      setSelected([])
      invalidateCustomers()
    }
  }, [
    blockPanel,
    deleteCustomer,
    invalidateCustomers,
    selected,
    showError,
    showSuccess,
    t,
  ])

  // Row handlers read through a ref: a new identity per render (navigate)
  // would rebuild the columns, and `parseTableColumns` sets the filters.
  const rowHandlers = useRef({ navigate, deleteSingle })
  rowHandlers.current = { navigate, deleteSingle }

  const actionsTemplate = useCallback(
    (rowData: Customer) => (
      <TableActions
        managerPermission={canManage}
        onEdit={() =>
          rowData.id &&
          rowHandlers.current.navigate(customerDetailPath(rowData.id))
        }
        onDelete={() =>
          rowData.id ? rowHandlers.current.deleteSingle(rowData.id) : undefined
        }
        deleteConfirm={{ pluralsPath: TABLE_NAME, entity: rowData }}
      />
    ),
    [canManage]
  )

  const baseColumns: DataTableColumnProps[] = useMemo(
    () =>
      TEXT_COLUMNS.map((key) => ({
        columnKey: key,
        header: t(`${TABLE_NAME}.table.columns.${key}`),
        field: key,
        filterField: key,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headers follow the UI language
    [i18n.language]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () =>
      parseTableColumns(
        baseColumns,
        visibleColumns,
        visibleMixins,
        getUiLangValue,
        setFilters,
        {
          columnKey: 'actions',
          headerClassName: styles.actionsCell,
          body: actionsTemplate,
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFilters is stable in effect
    [
      baseColumns,
      visibleColumns,
      visibleMixins,
      getUiLangValue,
      actionsTemplate,
    ]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={batchDelete}
          isDeleting={isDeleting}
          pluralsPath={TABLE_NAME}
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={baseColumns.map((column) => column.columnKey ?? '')}
          tableColumnHeaders={baseColumns.map((column) =>
            String(column.header ?? '')
          )}
          tableName={`${TABLE_NAME}.table.columns`}
          schemaType={SchemaType.CUSTOMER}
          managerPermission={canManage}
        />
      </div>
      <DataTable
        data-testid="customers-table"
        dataKey="id"
        value={tableData}
        columns={columns}
        loading={isLoading}
        selection={selected}
        selectionMode="multiple"
        onSelectionChange={(selection: unknown) =>
          setSelected(selection as Customer[])
        }
        onRowClick={(row) => {
          const id = (row as Customer).id
          if (id) navigate(customerDetailPath(id))
        }}
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        lazy={true}
        onSort={onSortCallback}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
      />
    </div>
  )
}

export default CustomersTable
