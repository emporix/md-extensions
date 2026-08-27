import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DateValue,
  Dropdown,
  StatusBadge,
  useToast,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'

import { DateFilterTemplate } from '../shared/DateFilterTemplate'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import { useSites } from '../../context/SitesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useReturnsApi } from '../../hooks/api/returns'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination, {
  type PaginatedResponse,
} from '../../hooks/usePagination'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import { parseTableColumns } from '../../helpers/tables'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { SchemaType } from '../../models/Schema.model'
import {
  Return,
  ReturnStatus,
  ReturnStatusColor,
} from '../../models/Returns.model'
import { returnDetailPath } from '../../constants/paths'
import { EmployeeDomains } from '../../configs/accessControls'
import styles from './ReturnsTable.module.scss'

const TABLE_NAME = 'returns.table'
/** Configuration key the column-visibility preference is stored under. */
const TABLE_NAME_CONFIG_KEY = 'ext_returns'

const ReturnsTable = ({ className = '' }: { readonly className?: string }) => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const { getReturns, deleteReturns } = useReturnsApi()
  const { refresh, setRefreshValue } = useRefresh()
  const { currentSite } = useSites()
  const { tenant } = useDashboardContext()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.RETURNS_MANAGER)
  const { getUiLangValue } = useLocalizedValue()
  const { tableConfigurations, fetchTableConfiguration, getTableMixinColumns } =
    useConfiguration()

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
    sortOrder: -1,
    sortField: 'metadata.createdAt',
  })

  const [tableData, setTableData] = useState<PaginatedResponse<Return>>()
  const [selectedReturns, setSelectedReturns] = useState<Return[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>([])
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(() =>
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )

  const batchDelete = async (toDelete: Return[]) => {
    setIsDeleting(true)
    blockPanel(true)
    try {
      await deleteReturns(toDelete.map((r) => r.id))
      showSuccess(t('returns.toasts.successDelete', { count: toDelete.length }))
      setSelectedReturns([])
      setRefreshValue()
    } catch (e: unknown) {
      showError(t('returns.toasts.errorDelete'), getApiErrorDetails(e))
    } finally {
      setIsDeleting(false)
      blockPanel(false)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const newData = await makeCall(
          () => getReturns(paginationParams),
          setIsSyncing
        )
        setTableData(newData as PaginatedResponse<Return>)
      } catch (e: unknown) {
        showError(t('returns.toasts.errorFetch'), getApiErrorDetails(e))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite?.code, paginationParams, tenant, refresh])

  useEffect(() => {
    setVisibleColumns(fetchTableConfiguration(TABLE_NAME_CONFIG_KEY))
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableConfigurations])

  const columns: DataTableColumnProps[] = useMemo(() => {
    const rawColumns: DataTableColumnProps[] = [
      {
        columnKey: 'requestor.firstName',
        header: t(`${TABLE_NAME}.customer.firstName`),
        field: 'requestor.firstName',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'requestor.lastName',
        header: t(`${TABLE_NAME}.customer.lastName`),
        field: 'requestor.lastName',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'metadata.createdAt',
        header: t(`${TABLE_NAME}.createdDate`),
        field: 'metadata.createdAt',
        filter: true,
        dataType: 'date',
        sortable: true,
        showFilterMenu: false,
        showClearButton: true,
        body: (rowData: Return) => (
          <DateValue
            date={rowData.metadata.createdAt}
            locale={i18n.language}
            showTime
          />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
      },
      {
        columnKey: 'id',
        header: t(`${TABLE_NAME}.id`),
        field: 'id',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'expiryDate',
        header: t(`${TABLE_NAME}.expiryDate`),
        field: 'expiryDate',
        filter: true,
        dataType: 'date',
        sortable: true,
        showFilterMenu: false,
        showClearButton: true,
        body: (rowData: Return) => (
          <DateValue
            date={rowData.expiryDate}
            locale={i18n.language}
            showTime
          />
        ),
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <DateFilterTemplate filterOptions={options} />
        ),
      },
      {
        columnKey: 'approvalStatus',
        header: t(`${TABLE_NAME}.approvalStatus`),
        field: 'approvalStatus',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: true,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <Dropdown
            className={styles.statusFilter}
            value={(options.value as string) ?? ''}
            options={[
              // CL Dropdown has no showClear; an explicit "All" clears it.
              { label: t('global.all'), value: '' },
              ...Object.values(ReturnStatus).map((status) => ({
                label: String(status),
                value: String(status),
              })),
            ]}
            onChange={(e) => options.filterApplyCallback(e.value || undefined)}
            valueTemplate={(option) =>
              option?.value ? (
                <StatusBadge
                  status={String(option.value)}
                  color={ReturnStatusColor[option.value as ReturnStatus]}
                />
              ) : (
                <span>{option?.label}</span>
              )
            }
            itemTemplate={(option) =>
              option?.value ? (
                <StatusBadge
                  status={String(option.value)}
                  color={ReturnStatusColor[option.value as ReturnStatus]}
                />
              ) : (
                <span>{option?.label}</span>
              )
            }
          />
        ),
        body: (rowData: Return) => (
          <StatusBadge
            status={rowData.approvalStatus}
            color={ReturnStatusColor[rowData.approvalStatus]}
          />
        ),
      },
    ]

    return parseTableColumns(
      rawColumns,
      visibleColumns,
      visibleMixins,
      getUiLangValue,
      setFilters,
      {
        columnKey: 'actions',
        headerStyle: { width: '116px' },
        body: (rowData: Return) => (
          <TableActions
            managerPermission={canManage}
            onDelete={() => batchDelete([rowData])}
            deleteConfirm={{ pluralsPath: 'returns', entity: rowData }}
            onEdit={() => navigate(returnDetailPath(rowData.id))}
          />
        ),
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, visibleMixins, i18n.language, canManage])

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: tableData?.totalRecords,
  }

  // parseTableColumns stamps `hidden` on every configurable column; the actions
  // column and mixin columns are excluded from the visibility toggles.
  const configurableColumns = useMemo(
    () => columns.filter((column) => 'hidden' in column),
    [columns]
  )

  return (
    <div className={className}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          disabled={!canManage}
          selected={selectedReturns}
          onDelete={() => batchDelete(selectedReturns)}
          isDeleting={isDeleting}
          pluralsPath="returns"
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={configurableColumns.map((column) =>
            String(column.columnKey ?? '')
          )}
          tableColumnHeaders={configurableColumns.map((column) =>
            String(column.header ?? '')
          )}
          tableName={TABLE_NAME}
          schemaType={SchemaType.RETURN}
          managerPermission={canManage}
        />
      </div>
      <DataTable
        dataKey="id"
        value={tableData?.values ?? []}
        selection={selectedReturns}
        onSelectionChange={(selection) =>
          setSelectedReturns(selection as Return[])
        }
        selectionMode="multiple"
        columns={columns}
        pagination={pagination}
        lazy={true}
        loading={isSyncing}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onRowClick={(row) => navigate(returnDetailPath((row as Return).id))}
      />
    </div>
  )
}

export default ReturnsTable
