import React, { forwardRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, DataTableFilterMeta } from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Message } from 'primereact/message'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { LogMessage } from '../../types/Log'
import { formatTimestamp } from '../../utils/formatHelpers'
import { SeverityBadge } from './SeverityBadge'
import { SEVERITY_OPTIONS } from '../../constants/logConstants'
import DateFilterTemplate from './DateFilterTemplate'

interface UnifiedLogsTableProps {
  // Data props - messages array
  messages?: LogMessage[]

  // Loading and error states
  loading?: boolean
  error?: string | null

  // Display options
  title?: string
  emptyMessage?: string
  className?: string
  style?: React.CSSProperties
}

const UnifiedLogsTable = forwardRef<any, UnifiedLogsTableProps>(
  (
    {
      messages,
      loading = false,
      error = null,
      title,
      emptyMessage = 'No logs found',
      className = 'unified-logs-datatable',
      style = { width: '100%' },
    },
    ref
  ) => {
    const { t } = useTranslation()

    // Filter state
    const [filters, setFilters] = useState<DataTableFilterMeta>({
      severity: { value: null, matchMode: FilterMatchMode.EQUALS },
      timestamp: { value: null, matchMode: FilterMatchMode.CONTAINS },
      agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
      message: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Sort state
    const [sortField, setSortField] = useState<string>('timestamp')
    const [sortOrder, setSortOrder] = useState<1 | -1>(-1)

    // Filter elements
    const severityFilterElement = useCallback(
      (options: ColumnFilterElementTemplateOptions) => {
        return (
          <Dropdown
            value={options.value}
            options={SEVERITY_OPTIONS}
            valueTemplate={(option) => {
              if (!option) return null
              return <SeverityBadge severity={option.value} />
            }}
            onChange={(e) => options.filterApplyCallback(e.value)}
            itemTemplate={(option) => <SeverityBadge severity={option.value} />}
            placeholder={t('select_severity', 'Select Severity')}
            className="p-column-filter"
            showClear
          />
        )
      },
      [t]
    )

    const dateFilterElement = useCallback(
      (options: ColumnFilterElementTemplateOptions) => {
        return <DateFilterTemplate options={options} />
      },
      []
    )

    // Filter change handler
    const handleFilterChange = useCallback((e: any) => {
      setFilters(e.filters as DataTableFilterMeta)
    }, [])

    // Sort change handler
    const handleSort = useCallback((e: any) => {
      setSortField(e.sortField)
      setSortOrder(e.sortOrder)
    }, [])

    const severityBodyTemplate = (rowData: LogMessage) => {
      return <SeverityBadge severity={rowData.severity} />
    }

    const timestampBodyTemplate = (rowData: LogMessage) => {
      return formatTimestamp(rowData.timestamp)
    }

    const messageBodyTemplate = (rowData: LogMessage) => {
      return (
        <div className="log-message-content">
          <span className="log-message-text">{rowData.message}</span>
        </div>
      )
    }

    const agentIdBodyTemplate = (rowData: LogMessage) => {
      return rowData.agentId || ''
    }

    const tableData = messages || []

    if (loading) {
      return (
        <div className="unified-logs-section">
          {title && (
            <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>
          )}
          <div className="logs-loading loading-state">
            <ProgressSpinner />
            <span className="icon-with-text">
              {t('loading_logs', 'Loading logs...')}
            </span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="unified-logs-section">
          {title && (
            <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>
          )}
          <Message severity="error" text={error} />
        </div>
      )
    }

    if (!tableData || tableData.length === 0) {
      return (
        <div className="unified-logs-section">
          {title && (
            <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>
          )}
          <Message severity="info" text={t('no_logs_found', emptyMessage)} />
        </div>
      )
    }

    return (
      <div className="unified-logs-section">
        {title && (
          <h4 className="mb-1rem">{t('related_logs', title)}</h4>
        )}
        <div className="unified-logs-table">
          <DataTable
            ref={ref}
            value={tableData}
            scrollable
            scrollHeight="600px"
            className={className}
            emptyMessage={t('no_logs_found', emptyMessage)}
            style={style}
            filters={filters}
            onFilter={handleFilterChange}
            filterDisplay="row"
            sortMode="single"
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            <Column
              field="severity"
              header={t('severity', 'Severity')}
              body={severityBodyTemplate}
              headerClassName="col-severity"
              bodyClassName="col-severity"
              filterHeaderClassName="col-severity"
              sortable
              filter
              filterMatchMode={FilterMatchMode.EQUALS}
              filterElement={severityFilterElement}
              showFilterMenu={false}
              showClearButton={false}
            />
            <Column
              field="timestamp"
              header={t('timestamp', 'Timestamp')}
              body={timestampBodyTemplate}
              headerClassName="col-timestamp"
              bodyClassName="col-timestamp"
              filterHeaderClassName="col-timestamp"
              sortable
              filter
              filterElement={dateFilterElement}
              showFilterMenu={false}
            />
            <Column
              field="agentId"
              header={t('logs_agent_id', 'Agent ID')}
              body={agentIdBodyTemplate}
              headerClassName="col-agent"
              bodyClassName="col-agent"
              filterHeaderClassName="col-agent"
              sortable
              filter
              filterPlaceholder={t('filter_by_agent_id', 'Filter by Agent ID')}
              showFilterMenu={false}
            />
            <Column
              field="message"
              header={t('message', 'Message')}
              body={messageBodyTemplate}
              headerClassName="col-message"
              bodyClassName="col-message"
              filterHeaderClassName="col-message"
              sortable
              filter
              filterPlaceholder={t('filter_by_message', 'Filter by Message')}
              showFilterMenu={false}
            />
          </DataTable>
        </div>
      </div>
    )
  }
)

UnifiedLogsTable.displayName = 'UnifiedLogsTable'

export default UnifiedLogsTable
