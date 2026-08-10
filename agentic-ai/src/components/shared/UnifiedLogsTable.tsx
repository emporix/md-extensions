import React, { forwardRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DataTableFilterMeta,
  DataTablePFSEvent,
} from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Message } from 'primereact/message'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Tooltip } from 'primereact/tooltip'
import { FilterMatchMode } from 'primereact/api'
import { LogMessage } from '../../types/Log'
import {
  formatTimestamp,
  normalizeEscapedNewlines,
} from '../../utils/formatHelpers'
import { highlightTextMatches } from '../../utils/formatHelpers.tsx'
import { useToast } from '../../contexts/ToastContext'
import { SeverityBadge } from './SeverityBadge'
import {
  CollapsibleText,
  CollapsibleTextToggle,
  useCollapsibleText,
} from './CollapsibleText'
import { SEVERITY_OPTIONS } from '../../constants/logConstants'
import DateFilterTemplate from './DateFilterTemplate'
import { AnalyzeLogsDialog } from './AnalyzeLogsDialog'
import starsIcon from '../../assets/stars_icon.svg'

interface UnifiedLogsTableProps {
  messages?: LogMessage[]
  loading?: boolean
  error?: string | null
  title?: string
  emptyMessage?: string
  className?: string
  style?: React.CSSProperties
  messageMaxLines?: number
  expandMessageTimestamp?: string
}

type LogMessageCellProps = {
  readonly message: string
  readonly timestamp: string
  readonly maxLines: number
  readonly highlightQuery?: string | null
  readonly expandMessageTimestamp?: string
}

const LogMessageCell = ({
  message,
  timestamp,
  maxLines,
  highlightQuery,
  expandMessageTimestamp,
}: LogMessageCellProps) => {
  const normalizedMessage = normalizeEscapedNewlines(message)
  const hasHighlightQuery = Boolean(highlightQuery?.trim())
  const shouldForceExpand =
    hasHighlightQuery || timestamp === expandMessageTimestamp
  const collapsible = useCollapsibleText(
    normalizedMessage,
    maxLines,
    shouldForceExpand
  )
  const displayContent = highlightTextMatches(normalizedMessage, highlightQuery)
  const hasToggle = collapsible.showToggle

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (hasToggle) {
      collapsible.toggle()
    }
  }

  return (
    <div
      className={`log-message-content ${hasToggle ? 'log-message-content--collapsible' : ''}`.trim()}
      data-log-timestamp={timestamp}
      onClick={handleContentClick}
    >
      <CollapsibleText
        as="div"
        content={displayContent}
        className="log-message-text"
        isExpanded={collapsible.isExpanded}
        textRef={collapsible.textRef}
        collapsedStyle={collapsible.collapsedStyle}
      />
      <CollapsibleTextToggle
        isExpanded={collapsible.isExpanded}
        onToggle={collapsible.toggle}
        visible={hasToggle}
        showLabel
        className="log-message-toggle"
      />
    </div>
  )
}

const UnifiedLogsTable = forwardRef<
  React.ComponentRef<typeof DataTable>,
  UnifiedLogsTableProps
>(
  (
    {
      messages,
      loading = false,
      error = null,
      title,
      emptyMessage,
      className = 'unified-logs-datatable',
      style = { width: '100%' },
      messageMaxLines,
      expandMessageTimestamp,
    },
    ref
  ) => {
    const { t } = useTranslation()
    const { showSuccess, showError } = useToast()
    const resolvedEmptyMessage = emptyMessage ?? t('no_logs_found')

    const [filters, setFilters] = useState<DataTableFilterMeta>({
      severity: { value: null, matchMode: FilterMatchMode.EQUALS },
      timestamp: { value: null, matchMode: FilterMatchMode.CONTAINS },
      agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
      message: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const [sortField, setSortField] = useState<string>('timestamp')
    const [sortOrder, setSortOrder] = useState<1 | -1>(1)
    const [analyzeDialogVisible, setAnalyzeDialogVisible] = useState(false)

    const handleCopyAllLogs = useCallback(async () => {
      const messageTexts = (messages ?? []).map((entry) => entry.message)
      const payload = JSON.stringify(messageTexts, null, 2)

      try {
        await navigator.clipboard.writeText(payload)
        showSuccess(t('logs_copied_to_clipboard'))
      } catch (error) {
        console.error('Failed to copy logs to clipboard', error)
        showError(t('failed_to_copy_logs'))
      }
    }, [messages, showError, showSuccess, t])

    const severityFilterElement = useCallback(
      (options: ColumnFilterElementTemplateOptions) => {
        const placeholderText = t('select_severity')
        return (
          <Dropdown
            value={options.value}
            options={SEVERITY_OPTIONS}
            valueTemplate={(option) => {
              if (!option)
                return (
                  <span className="dropdown-placeholder">
                    {placeholderText}
                  </span>
                )
              return <SeverityBadge severity={option.value} />
            }}
            onChange={(e) => options.filterApplyCallback(e.value)}
            itemTemplate={(option) => <SeverityBadge severity={option.value} />}
            placeholder={placeholderText}
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

    const handleFilterChange = useCallback((e: DataTablePFSEvent) => {
      setFilters(e.filters as DataTableFilterMeta)
    }, [])

    const handleSort = useCallback((e: DataTablePFSEvent) => {
      setSortField(e.sortField)
      setSortOrder(e.sortOrder as 1 | -1)
    }, [])

    const severityBodyTemplate = (rowData: LogMessage) => {
      return <SeverityBadge severity={rowData.severity} />
    }

    const timestampBodyTemplate = (rowData: LogMessage) => {
      return formatTimestamp(rowData.timestamp)
    }

    const messageFilterValue =
      typeof filters.message === 'object' &&
      filters.message !== null &&
      'value' in filters.message
        ? (filters.message.value as string | null)
        : null

    const messageBodyTemplate = (rowData: LogMessage) => {
      const normalizedMessage = normalizeEscapedNewlines(rowData.message)
      const highlightedContent = highlightTextMatches(
        normalizedMessage,
        messageFilterValue
      )

      if (messageMaxLines !== undefined) {
        return (
          <LogMessageCell
            message={rowData.message}
            timestamp={rowData.timestamp}
            maxLines={messageMaxLines}
            highlightQuery={messageFilterValue}
            expandMessageTimestamp={expandMessageTimestamp}
          />
        )
      }

      return (
        <div
          className="log-message-content"
          data-log-timestamp={rowData.timestamp}
        >
          <span className="log-message-text">{highlightedContent}</span>
        </div>
      )
    }

    const agentIdBodyTemplate = (rowData: LogMessage) => {
      return rowData.agentId || ''
    }

    const tableData = messages || []
    const showHeaderActions =
      messageMaxLines !== undefined && tableData.length > 0

    const renderSectionHeader = (className = '') => {
      if (!title && !showHeaderActions) {
        return null
      }

      return (
        <div className={`unified-logs-section-header ${className}`.trim()}>
          {title ? (
            <h4 className="panel-section-title">{t('related_logs')}</h4>
          ) : (
            <span />
          )}
          {showHeaderActions && (
            <div className="unified-logs-section-actions">
              <Tooltip target=".unified-logs-copy-all" />
              <Button
                type="button"
                className="p-button-secondary unified-logs-analyze"
                onClick={() => setAnalyzeDialogVisible(true)}
              >
                <img
                  src={starsIcon}
                  alt=""
                  className="unified-logs-analyze-icon"
                  aria-hidden="true"
                />
                <span className="p-button-label">{t('analyze_logs')}</span>
              </Button>
              <Button
                type="button"
                label={t('copy_all_logs')}
                icon="pi pi-copy"
                className="p-button-secondary unified-logs-copy-all"
                onClick={() => void handleCopyAllLogs()}
                aria-label={t('copy_all_logs_to_clipboard')}
                data-pr-tooltip={t('copy_all_logs_to_clipboard')}
                data-pr-position="top"
              />
            </div>
          )}
        </div>
      )
    }

    if (loading) {
      return (
        <div className="unified-logs-section">
          {renderSectionHeader('section-spacing-sm')}
          <div className="logs-loading loading-state">
            <ProgressSpinner />
            <span className="icon-with-text">{t('loading_logs')}</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="unified-logs-section">
          {renderSectionHeader('section-spacing-sm')}
          <Message severity="error" text={error} />
        </div>
      )
    }

    if (!tableData || tableData.length === 0) {
      return (
        <div className="unified-logs-section">
          {renderSectionHeader('section-spacing-sm')}
          <Message severity="info" text={resolvedEmptyMessage} />
        </div>
      )
    }

    return (
      <div className="unified-logs-section">
        {renderSectionHeader('mb-1rem')}
        <AnalyzeLogsDialog
          visible={analyzeDialogVisible}
          onHide={() => setAnalyzeDialogVisible(false)}
          logMessages={(messages ?? []).map((entry) => ({
            severity: entry.severity,
            message: entry.message,
          }))}
        />
        <div className="unified-logs-table">
          <DataTable
            ref={ref}
            value={tableData}
            scrollable
            scrollHeight="800px"
            className={className}
            emptyMessage={resolvedEmptyMessage}
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
              header={t('severity')}
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
              header={t('timestamp')}
              body={timestampBodyTemplate}
              headerClassName="col-timestamp"
              bodyClassName="col-timestamp"
              filterHeaderClassName="col-timestamp"
              sortable
              filter
              filterElement={dateFilterElement}
              showFilterMenu={false}
              showClearButton={false}
            />
            <Column
              field="agentId"
              header={t('logs_agent_id')}
              body={agentIdBodyTemplate}
              headerClassName="col-agent"
              bodyClassName="col-agent"
              filterHeaderClassName="col-agent"
              sortable
              filter
              filterPlaceholder={t('filter_by_agent_id')}
              showFilterMenu={false}
              showClearButton={false}
            />
            <Column
              field="message"
              header={t('message')}
              body={messageBodyTemplate}
              headerClassName="col-message"
              bodyClassName="col-message"
              filterHeaderClassName="col-message"
              sortable
              filter
              filterPlaceholder={t('filter_by_message')}
              showFilterMenu={false}
              showClearButton={false}
            />
          </DataTable>
        </div>
      </div>
    )
  }
)

export default UnifiedLogsTable
