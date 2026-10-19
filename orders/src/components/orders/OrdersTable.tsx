import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DateValue,
  Dropdown,
  FilterMatchMode,
  MoneyValue,
  SecondaryButton,
  StatusBadge,
  useToast,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { BsDownload } from 'react-icons/bs'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import { DateFilterTemplate } from '../shared/DateFilterTemplate'
import LinkWithIcon from '../shared/LinkWithIcon'
import NumberFilterTemplate from '../shared/NumberFilterTemplate'
import TableExtensions from '../shared/TableExtensions'
import OrdersTableAction from './OrdersTableAction'
import OrderStatusBadge from './OrderStatusBadge'
import OrderEntriesList from './entries/OrderEntriesList'
import EntryTable from './legacy/EntryTable'
import OrderCSVExportDialog from './OrderCSVExportDialog'
import MasterOrderDialog from './MasterOrderDialog'
import { useSites } from '../../context/SitesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useOrdersApi } from '../../hooks/api/orders'
import { usePaymentGatewayApi } from '../../hooks/api/paymentGateway'
import { useConfigurationApi } from '../../hooks/api/configuration'
import { useOrderRestrictions } from '../../hooks/useOrderRestrictions'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination, {
  type PaginatedResponse,
} from '../../hooks/usePagination'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import { buildOrderQueryParams } from '../../helpers/orders'
import { parseTableColumns } from '../../helpers/tables'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import type { PaymentMethod } from '../../models/PaymentGateway.model'
import { SchemaType } from '../../models/Schema.model'
import { Order, OrderStatus, OrderStatusColor } from '../../models/Order.model'
import { orderDetailPath } from '../../constants/paths'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import styles from './OrdersTable.module.scss'

export const TABLE_NAME = 'orders.table'
/** Configuration key the column-visibility preference is stored under (MD). */
export const TABLE_NAME_CONFIG_KEY = 'ext_orders'

const ALL = ''

type OrdersTableProps = {
  readonly showTableOptions: boolean
  readonly defaultSiteActive?: boolean
  readonly isVendorAware?: boolean
  readonly className?: string
}

const OrdersTable = ({
  showTableOptions,
  defaultSiteActive = true,
  isVendorAware = false,
  className = '',
}: OrdersTableProps) => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const { getUiLangValue } = useLocalizedValue()
  const { getPaymentMethods } = usePaymentGatewayApi()
  const { getSyncBetweenRestrictionsAndSiteCodes } = useConfigurationApi()
  const { deleteOrder, syncOrders, syncOrdersNotSiteSpecific } = useOrdersApi()
  const { refresh, setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const { sites, currentSite, updateCurrentSite } = useSites()
  const { blockPanel } = useUIBlocker()
  const { hasPermission, vendor } = usePermissions()
  const orderRestrictions = useOrderRestrictions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const {
    tableConfigurations,
    fetchTableConfiguration,
    getTableMixinColumns,
    contentLanguage,
  } = useConfiguration()

  const {
    paginationParams,
    onPageCallback,
    onFilterCallback,
    onSortCallback,
    setFilters,
  } = usePagination({
    currentPage: 1,
    rows: 10,
    first: 0,
    sortField: 'created',
    sortOrder: -1,
  })

  const [enableSync, setEnableSync] = useState(true)
  const [masterOrder, setMasterOrder] = useState<Order>()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])
  const [expandedRows, setExpandedRows] = useState<Order[]>([])
  const [tableData, setTableData] = useState<PaginatedResponse<Order>>()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [orderCsvDialog, setOrderCsvDialog] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>([])
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )

  useEffect(() => {
    void (async () => {
      try {
        const config = await getSyncBetweenRestrictionsAndSiteCodes()
        if (config && typeof config.value === 'boolean') {
          setEnableSync(config.value)
        }
      } catch (error) {
        console.error('Error fetching enableSync configuration:', error)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  const isSiteRestricted = useCallback(
    (siteCode: string | undefined): boolean => {
      if (!enableSync || !orderRestrictions || !siteCode) return false
      return !orderRestrictions.includes(siteCode)
    },
    [enableSync, orderRestrictions]
  )

  useEffect(() => {
    if (!isSiteRestricted(currentSite?.code) || !defaultSiteActive) return
    showError(
      t('orders.toasts.siteRestrictionError', { siteCode: currentSite?.code })
    )
    const allowedSite = sites?.find((s) => orderRestrictions?.includes(s.code))
    if (allowedSite) {
      updateCurrentSite(allowedSite)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSite?.code,
    isSiteRestricted,
    sites,
    orderRestrictions,
    defaultSiteActive,
  ])

  useEffect(() => {
    void (async () => {
      if (isSiteRestricted(currentSite?.code)) {
        setTableData(undefined)
        return
      }
      try {
        const params = buildOrderQueryParams(isVendorAware, vendor)
        const newData = await makeCall(
          () =>
            defaultSiteActive
              ? syncOrders(paginationParams, params)
              : syncOrdersNotSiteSpecific(paginationParams, params),
          setIsSyncing
        )
        setTableData(newData)
      } catch (e: unknown) {
        showError(t('orders.toasts.errorFetch'), getApiErrorDetails(e))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSite?.code,
    paginationParams,
    tenant,
    defaultSiteActive,
    isSiteRestricted,
    isVendorAware,
    vendor,
    refresh,
  ])

  // Payment methods feed the payment filter options. Fetched separately from
  // the list: a new array per list fetch re-built the columns, which re-ran
  // setFilters -> new paginationParams -> another list fetch (endless loop).
  useEffect(() => {
    if (!currentSite?.code) return
    void (async () => {
      try {
        setPaymentMethods(await getPaymentMethods())
      } catch (e) {
        console.error(e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite?.code, tenant])

  useEffect(() => {
    if (showTableOptions) {
      setVisibleColumns(fetchTableConfiguration(TABLE_NAME_CONFIG_KEY))
    }
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableConfigurations])

  const paymentMethodCodes = paymentMethods.map((pm) => pm.code).join('|')
  const paymentMethodOptions = useMemo(
    () => paymentMethods.map((pm) => ({ label: pm.code, value: pm.code })),
    // Keyed by content so an identical refetch does not rebuild the columns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paymentMethodCodes]
  )

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    blockPanel(true)
    try {
      await Promise.all(selectedOrders.map((order) => deleteOrder(order.id)))
      showSuccess(
        t('orders.toasts.successBatchDelete', { count: selectedOrders.length })
      )
      setSelectedOrders([])
      setRefreshValue()
    } catch (e: unknown) {
      showError(t('orders.actions.delete.error.title'), getApiErrorDetails(e))
    } finally {
      setIsDeleting(false)
      blockPanel(false)
    }
  }

  const expandOrder = useCallback(
    (data: Order) =>
      data.calculatedPrice ? (
        <OrderEntriesList readonly withMixins={false} order={data} />
      ) : (
        <EntryTable readonly tableName={TABLE_NAME} data={data} />
      ),
    []
  )

  const columns: DataTableColumnProps[] = useMemo(() => {
    const statusTemplate = (
      option: { label?: string; value?: unknown } | null
    ) =>
      option?.value ? (
        <StatusBadge
          status={String(option.value)}
          color={OrderStatusColor[option.value as OrderStatus]}
        />
      ) : (
        <span>{option?.label}</span>
      )

    const rawColumns: DataTableColumnProps[] = [
      {
        columnKey: 'id',
        header: t(`${TABLE_NAME}.id`),
        field: 'id',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
        style: { whiteSpace: 'nowrap' },
        body: (rowData: Order) =>
          rowData.subOrders && rowData.subOrders.length > 0 ? (
            <LinkWithIcon
              onClick={() => setMasterOrder(rowData)}
              label={rowData.id}
            />
          ) : (
            rowData.id
          ),
      },
      {
        columnKey: 'customer.name',
        header: t(`${TABLE_NAME}.customer.name`),
        field: 'customer.name',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '180px' },
      },
      {
        columnKey: 'customer.email',
        header: t(`${TABLE_NAME}.customer.email`),
        field: 'customer.email',
        filter: true,
        sortable: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        columnKey: 'customer.id',
        header: t(`${TABLE_NAME}.customer.id`),
        field: 'customer.id',
        filter: true,
        sortable: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
        headerStyle: { minWidth: '200px' },
      },
      {
        columnKey: 'totalPrice',
        header: t(`${TABLE_NAME}.totalPrice`),
        field: 'calculatedPrice.finalPrice.grossValue',
        filter: true,
        align: 'right',
        bodyStyle: { paddingRight: '12px' },
        headerStyle: { minWidth: '180px', paddingRight: '12px' },
        dataType: 'numeric',
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <NumberFilterTemplate filterOptions={options} decimalPlaces={2} />
        ),
        body: (rowData: Order) => (
          <MoneyValue
            currency={rowData.currency}
            value={
              rowData.calculatedPrice?.finalPrice?.grossValue ??
              rowData.totalPrice
            }
            locale={i18n.language}
          />
        ),
      },
      {
        columnKey: 'payments.method',
        header: t(`${TABLE_NAME}.payments`),
        field: 'payments',
        filterField: 'payments.method',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <Dropdown
            className={styles.paymentFilter}
            value={(options.value as string) ?? ALL}
            options={[
              // CL Dropdown has no showClear; an explicit "All" clears it.
              { label: t('global.all'), value: ALL },
              ...paymentMethodOptions,
            ]}
            onChange={(e) => options.filterApplyCallback(e.value || undefined)}
          />
        ),
        body: (rowData: Order) =>
          rowData.payments?.map((payment) => payment.method).join(', ') ?? '',
      },
      {
        columnKey: 'deliveryWindow.deliveryCycle',
        header: t(`${TABLE_NAME}.orderCycle`),
        field: 'deliveryWindow.deliveryCycle',
        filter: true,
        sortable: true,
        dataType: 'date',
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Order) => (
          <DateValue
            date={rowData.deliveryWindow?.deliveryCycle}
            nullText={t('global.always')}
            locale={i18n.language}
          />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} selectionMode="range" />
        ),
      },
      {
        columnKey: 'created',
        header: t(`${TABLE_NAME}.created`),
        field: 'created',
        filter: true,
        dataType: 'date',
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Order) => (
          <DateValue date={rowData.created} showTime locale={i18n.language} />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} selectionMode="range" />
        ),
        headerStyle: { minWidth: '200px' },
      },
      {
        columnKey: 'status',
        header: t(`${TABLE_NAME}.status`),
        field: 'status',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: Order) => <OrderStatusBadge order={rowData} />,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <Dropdown
            className={styles.statusFilter}
            value={(options.value as string) ?? ALL}
            options={[
              { label: t('global.all'), value: ALL },
              ...Object.values(OrderStatus).map((status) => ({
                label: status,
                value: status,
              })),
            ]}
            onChange={(e) => options.filterApplyCallback(e.value || undefined)}
            valueTemplate={statusTemplate}
            itemTemplate={statusTemplate}
          />
        ),
      },
    ]

    return parseTableColumns(
      [
        { columnKey: 'expander', expander: true, style: { width: '3em' } },
        ...rawColumns,
      ],
      visibleColumns,
      visibleMixins,
      getUiLangValue,
      setFilters,
      showTableOptions
        ? {
            columnKey: 'actions',
            headerStyle: { width: '180px' },
            body: (rowData: Order) => (
              <OrdersTableAction
                managerPermission={canManage}
                order={rowData}
                onDelete={async (orderId) => {
                  await deleteOrder(orderId)
                  setRefreshValue()
                }}
                onUpdate={() => setRefreshValue()}
              />
            ),
          }
        : undefined
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    i18n.language,
    visibleColumns,
    paymentMethodOptions,
    contentLanguage,
    visibleMixins,
    canManage,
    showTableOptions,
  ])

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: tableData?.totalRecords,
  }

  // parseTableColumns stamps `hidden` on every raw column; the expander,
  // actions and mixin columns are excluded from the visibility toggles.
  const configurableColumns = useMemo(
    () =>
      columns.filter(
        (column) => 'hidden' in column && column.columnKey !== 'expander'
      ),
    [columns]
  )

  return (
    <div className={className}>
      {showTableOptions && (
        <div className={styles.toolbar}>
          <BatchDeleteButton
            selected={selectedOrders}
            onDelete={handleBulkDelete}
            disabled={!canManage}
            isDeleting={isDeleting}
            pluralsPath="orders"
          />
          <div className={styles.toolbarActions}>
            <SecondaryButton
              size="small"
              iconOnly
              onClick={() => setOrderCsvDialog(true)}
              aria-label={t('orders.csv.dialog.title')}
            >
              <BsDownload size={18} />
            </SecondaryButton>
            <TableExtensions
              tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
              tableColumns={configurableColumns.map((column) =>
                String(column.columnKey ?? '')
              )}
              tableColumnHeaders={configurableColumns.map((column) =>
                String(column.header ?? '')
              )}
              tableName={TABLE_NAME}
              schemaType={SchemaType.ORDER}
              managerPermission={canManage}
            />
          </div>
        </div>
      )}
      <DataTable
        dataKey="id"
        value={tableData?.values ?? []}
        {...(showTableOptions
          ? {
              selection: selectedOrders,
              selectionMode: 'multiple' as const,
              onSelectionChange: (selection: unknown) =>
                setSelectedOrders(selection as Order[]),
            }
          : {})}
        columns={columns}
        pagination={pagination}
        lazy={true}
        loading={isSyncing}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        rowExpansionTemplate={expandOrder}
        expandedRows={expandedRows}
        onRowToggle={(rows) => setExpandedRows(rows as Order[])}
        onRowClick={(row) => navigate(orderDetailPath((row as Order).id))}
      />
      <OrderCSVExportDialog
        visible={orderCsvDialog}
        onReject={() => setOrderCsvDialog(false)}
      />
      <MasterOrderDialog
        visible={!!masterOrder}
        order={masterOrder}
        onHide={() => setMasterOrder(undefined)}
      />
    </div>
  )
}

export default OrdersTable
