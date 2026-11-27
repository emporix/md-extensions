import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { BsFileCheckFill, BsFileXFill } from 'react-icons/bs'
import { useSites } from '../../context/SitesProvider'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useConfigurationApi } from '../../hooks/api/configuration'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import usePagination, {
  DEFAULT_PAGINATION_PROPS,
} from '../../hooks/usePagination'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useQuoteRestrictions } from '../../hooks/useQuoteRestrictions'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import useQuotesColumns, { TABLE_NAME } from '../../hooks/useQuotesColumns'
import { Quote, QuoteChangeStatusType } from '../../models/Quotes.model'
import { SchemaType } from '../../models/Schema.model'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { parseTableColumns } from '../../helpers/tables'
import { createRequestTracker, getApiErrorDetails } from '../../helpers/api'
import { StylableProps } from '../../helpers/props'
import { canChangeQuoteStatus } from '../../helpers/quoteStatus.helpers'
import { isQuoteIncomplete } from '../../helpers/quotePricing.helpers'
import { EmployeeDomains } from '../../configs/accessControls'
import { quoteDetailPath } from '../../constants/paths'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import TableExtensions from '../shared/TableExtensions'
import QuotesChangeStatus from './QuotesChangeStatus'
import QuotesTableExpansion from './QuotesTableExpansion'
import styles from './QuotesTable.module.scss'

const TABLE_NAME_CONFIG_KEY = 'ext_quotes'

/** MD renders the expander as its own first column, outside the toggles. */
const EXPANDER_COLUMN: DataTableColumnProps = {
  columnKey: 'expander',
  expander: true,
  style: { width: '3em' },
}

interface UpdateQuoteData {
  quoteId: string
  type: QuoteChangeStatusType
}

/**
 * MD `QuotesTable`: the lazy list of the current site's quotes with column
 * visibility (`ext_quotes`) and mixin columns, row expansion, approve /
 * decline / edit / delete row actions and batch delete. Only the latest load
 * is applied, so a late response for a previous tenant, site or page is
 * dropped.
 */
const QuotesTable = (props: StylableProps) => {
  const { className = '' } = props
  const { t, i18n } = useTranslation()
  const { tenant } = useDashboardContext()
  const { sites, currentSite, updateCurrentSite } = useSites()
  const { getUiLangValue } = useLocalizedValue()
  const { columns: rawColumns } = useQuotesColumns()
  const { getTableMixinColumns, tableConfigurations, fetchTableConfiguration } =
    useConfiguration()
  const [isDeleting, setIsDeleting] = useState(false)
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const toast = useToast()
  const { getQuotes, deleteQuote } = useQuotesApi()
  const [tableData, setTableData] = useState<Quote[]>([])
  const [expandedRows, setExpandedRows] = useState<Quote[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [updateQuoteData, setUpdateQuoteData] = useState<UpdateQuoteData>()
  const [selectedQuotes, setSelectedQuotes] = useState<Quote[]>([])
  const {
    paginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
    setFilters,
  } = usePagination({
    ...DEFAULT_PAGINATION_PROPS,
    sortField: 'metadata.createdAt',
    sortOrder: -1,
  })
  const [mixinColumns, setMixinColumns] = useState<DisplayMixin[]>(
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility[]>(
    fetchTableConfiguration(TABLE_NAME_CONFIG_KEY)
  )
  const { hasPermission } = usePermissions()
  const quoteRestrictions = useQuoteRestrictions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)
  const { getSyncBetweenRestrictionsAndSiteCodes } = useConfigurationApi()
  const [enableSync, setEnableSync] = useState<boolean>(true)
  const trackRequest = useRef(createRequestTracker()).current

  const isSiteRestricted = useCallback(
    (siteCode: string | undefined): boolean => {
      if (!enableSync || !quoteRestrictions || !siteCode) return false
      return !quoteRestrictions.includes(siteCode)
    },
    [enableSync, quoteRestrictions]
  )

  useEffect(() => {
    setMixinColumns(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
    setVisibleColumns(fetchTableConfiguration(TABLE_NAME_CONFIG_KEY))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [tableConfigurations])

  // Per tenant (MD fetched it once): the setting belongs to the tenant.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const config = await getSyncBetweenRestrictionsAndSiteCodes()
        if (!cancelled && config && typeof config.value === 'boolean') {
          setEnableSync(config.value)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching enableSync configuration:', error)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per tenant
  }, [tenant])

  // A host tenant switch drops what belongs to the previous tenant: rows,
  // selection, expanded rows and an open approve / decline dialog.
  useUpdateEffect(() => {
    setTableData([])
    setSelectedQuotes([])
    setExpandedRows([])
    setUpdateQuoteData(undefined)
  }, [tenant])

  useEffect(() => {
    if (!isSiteRestricted(currentSite?.code)) return
    toast.showToast(
      t('quotes.toasts.siteRestrictionError', {
        siteCode: currentSite?.code,
      }),
      '',
      'error'
    )
    const allowedSite = sites?.find((s) => quoteRestrictions?.includes(s.code))
    if (allowedSite) {
      updateCurrentSite(allowedSite)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [currentSite?.code, isSiteRestricted, sites, quoteRestrictions])

  // Every load starts a new request: a response that is no longer the latest
  // (previous tenant, site or page) changes nothing.
  useEffect(() => {
    ;(async () => {
      const isLatest = trackRequest()
      if (isSiteRestricted(currentSite?.code)) {
        setTableData([])
        setTotalCount(0)
        setIsSyncing(false)
        return
      }

      setIsSyncing(true)
      try {
        const { data, totalRecords } = await getQuotes(
          paginationParams,
          currentSite?.code
        )
        if (!isLatest()) return
        setTotalCount(totalRecords)
        setTableData(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (isLatest()) setIsSyncing(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [currentSite?.code, tenant, paginationParams, isSiteRestricted])

  // A refresh (after a delete) reloads the rows and the total (MD reloaded the
  // rows only, so the paginator total stayed stale).
  useEffect(() => {
    ;(async () => {
      if (refresh) {
        if (isSiteRestricted(currentSite?.code)) {
          return
        }
        const isLatest = trackRequest()
        try {
          const { data, totalRecords } = await getQuotes(
            paginationParams,
            currentSite?.code
          )
          if (isLatest()) {
            setTableData(data)
            setTotalCount(totalRecords)
          }
        } finally {
          // It may have replaced a list load that was still running.
          if (isLatest()) setIsSyncing(false)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [refresh])

  const deleteSingleQuote = async (quoteId: string) => {
    blockPanel(true)
    try {
      await deleteQuote(quoteId)
      toast.showToast(
        t('quotes.toasts.successDelete', { quoteId }),
        '',
        'success'
      )
      setRefreshValue()
    } catch (e) {
      console.error(e)
      toast.showError(
        t('quotes.toasts.errorDelete', { quoteId }),
        getApiErrorDetails(e)
      )
    } finally {
      blockPanel(false)
    }
  }

  const deleteQuotes = async (quoteIds: string[]) => {
    setIsDeleting(true)
    for (const id of quoteIds) {
      await deleteSingleQuote(id)
    }
    setSelectedQuotes([])
    setIsDeleting(false)
  }

  const actionBodyTemplate = (rowData: Quote) => {
    return (
      <TableActions
        managerPermission={canManage}
        onEdit={() => navigate(quoteDetailPath(rowData.id))}
        onDelete={() => deleteSingleQuote(rowData.id)}
        deleteConfirm={{ pluralsPath: 'quotes', entity: rowData }}
        actions={[
          {
            icon: <BsFileCheckFill className={styles.approveIcon} size={18} />,
            onClick: () =>
              setUpdateQuoteData({
                quoteId: rowData.id,
                type: QuoteChangeStatusType.change,
              }),
            // The quote service rejects OPEN while a price or an address is missing.
            disabled:
              !canChangeQuoteStatus(rowData.status.value, canManage) ||
              isQuoteIncomplete(rowData),
            tooltip: t('quotes.tooltip.approve'),
            dataTestId: `quote-approve-${rowData.id}`,
          },
          {
            icon: <BsFileXFill className={styles.declineIcon} size={18} />,
            onClick: () =>
              setUpdateQuoteData({
                quoteId: rowData.id,
                type: QuoteChangeStatusType.decline,
              }),
            disabled: !canChangeQuoteStatus(rowData.status.value, canManage),
            tooltip: t('quotes.tooltip.decline'),
            dataTestId: `quote-decline-${rowData.id}`,
          },
        ]}
      />
    )
  }

  const columns = useMemo(() => {
    return parseTableColumns(
      rawColumns,
      visibleColumns,
      mixinColumns,
      getUiLangValue,
      setFilters,
      {
        columnKey: 'actions',
        field: 'actions',
        headerStyle: { width: '184px' },
        body: actionBodyTemplate,
      }
    )
    // MD's deps, plus the tenant: the row actions call the API of the tenant
    // they were built for.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [TABLE_NAME, i18n.language, canManage, mixinColumns, rawColumns, tenant])

  // Toggleable columns: parseTableColumns stamps `hidden` on the base ones.
  const configurableColumns = columns.filter((column) => 'hidden' in column)

  const onRowClick = (q: Quote) => {
    navigate(quoteDetailPath(q.id))
  }

  return (
    <div className={className}>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selectedQuotes}
          onDelete={() => deleteQuotes(selectedQuotes.map((q) => q.id))}
          isDeleting={isDeleting}
          pluralsPath="quotes"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={configurableColumns.map(
            (column) => column.columnKey ?? ''
          )}
          tableColumnHeaders={configurableColumns.map((column) =>
            String(column.header ?? '')
          )}
          tableName={`${TABLE_NAME}`}
          schemaType={SchemaType.QUOTE}
          managerPermission={canManage}
        />
      </div>

      <DataTable
        data-testid="quotes-table"
        value={tableData.length > 0 ? tableData : []}
        columns={[EXPANDER_COLUMN, ...columns]}
        loading={isSyncing}
        lazy={true}
        selection={selectedQuotes}
        selectionMode="multiple"
        onSelectionChange={(selection) =>
          setSelectedQuotes(selection as Quote[])
        }
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        rowExpansionTemplate={(rowData: Quote) => (
          <QuotesTableExpansion items={rowData.items} />
        )}
        pagination={{
          ...paginationParams,
          totalRecords: totalCount,
        }}
        currentPageReportTemplate={t('global.pagination')}
        emptyMessage={t('global.noDataFound')}
        onFilter={onFilterCallback}
        onPage={onPageCallback}
        onSort={onSortCallback}
        expandedRows={expandedRows}
        onRowToggle={(rows) => setExpandedRows(rows)}
        onRowClick={onRowClick}
      />

      {updateQuoteData && (
        <QuotesChangeStatus
          visible={!!updateQuoteData}
          changeType={updateQuoteData.type}
          quoteId={updateQuoteData.quoteId}
          close={() => setUpdateQuoteData(undefined)}
        />
      )}
    </div>
  )
}

export default QuotesTable
