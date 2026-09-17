import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import {
  DataTable,
  DataTableFilterMeta,
  DataTablePFSEvent,
} from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { SessionLogs } from '../../types/Log'
import { formatTimestamp } from '../../utils/formatHelpers'
import { SeverityBadge } from '../shared/SeverityBadge'
import DateFilterTemplate from '../shared/DateFilterTemplate'
import { SEVERITY_OPTIONS } from '../../constants/logConstants'
import { handleDataTableSort } from '../../utils/dataTableHelpers'
import CursorPaginator from '../shared/CursorPaginator'
import {
  SESSION_SORT_FIELD_MAP,
  parseLogListQuery,
  writeNamespacedParams,
  type LogListQueryPatch,
} from '../../utils/logListQuery.helpers'

interface SessionsTabProps {
  onSessionClick?: (sessionId: string, agentId: string) => void
  sessions: SessionLogs[]
  loading: boolean
  error: string | null
  pageSize: number
  nextCursor: string | null
  prevCursor: string | null
  goNext: () => void
  goPrevious: () => void
}

const SessionsTab: React.FC<SessionsTabProps> = ({
  onSessionClick,
  sessions,
  loading,
  error,
  pageSize,
  nextCursor,
  prevCursor,
  goNext,
  goPrevious,
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const listQuery = useMemo(
    () => parseLogListQuery(location.search),
    [location.search]
  )
  const sessionFilters = listQuery.sessions.filters
  const sortField = listQuery.sessions.sortField
  const sortOrder = listQuery.sessions.sortOrder

  const replaceListQuery = useCallback(
    (patch: LogListQueryPatch) => {
      const nextSearch = writeNamespacedParams(location.search, 's', patch)
      if (nextSearch === (location.search || '')) {
        return
      }
      navigate(
        { pathname: location.pathname, search: nextSearch },
        { replace: true }
      )
    },
    [location.pathname, location.search, navigate]
  )

  const handleSessionClick = useCallback(
    (session: SessionLogs) => {
      if (onSessionClick) {
        onSessionClick(session.sessionId, session.triggerAgentId)
      }
    },
    [onSessionClick]
  )

  const handleSessionFilterChange = useCallback(
    (e: DataTablePFSEvent) => {
      replaceListQuery({
        filters: e.filters as DataTableFilterMeta,
      })
    },
    [replaceListQuery]
  )

  const handleSort = useCallback(
    (event: DataTablePFSEvent) => {
      const [, , newSortField, newSortOrder] = handleDataTableSort(
        event,
        sortField,
        sortOrder,
        SESSION_SORT_FIELD_MAP
      )
      replaceListQuery({
        sortField: newSortField,
        sortOrder: newSortOrder,
      })
    },
    [replaceListQuery, sortField, sortOrder]
  )

  const handleRowsChange = useCallback(
    (rows: number) => {
      replaceListQuery({ rows })
    },
    [replaceListQuery]
  )

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true)
    }
  }, [loading])

  const severityBodyTemplate = (rowData: SessionLogs) => {
    return <SeverityBadge severity={rowData.severity} />
  }

  const severityFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => {
      const placeholderText = t('select_result', 'Select Result')
      return (
        <Dropdown
          value={options.value}
          options={SEVERITY_OPTIONS}
          valueTemplate={(option) => {
            if (!option)
              return (
                <span className="dropdown-placeholder">{placeholderText}</span>
              )
            return <SeverityBadge severity={option.value} />
          }}
          onChange={(e) => options.filterApplyCallback(e.value)}
          itemTemplate={(option) => <SeverityBadge severity={option.value} />}
          placeholder={placeholderText}
          className="p-column-filter filter-dropdown-wide"
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

  const agentsBodyTemplate = (rowData: SessionLogs) => {
    return rowData.agents.join(', ')
  }

  const createDateTimeBodyTemplate = (fieldPath: string) => {
    return (rowData: SessionLogs) => {
      const value = fieldPath.split('.').reduce((obj: unknown, key: string) => {
        if (obj && typeof obj === 'object' && key in obj) {
          return (obj as Record<string, unknown>)[key]
        }
        return undefined
      }, rowData as unknown)
      return formatTimestamp(value as string)
    }
  }

  const renderSessionsTable = useMemo(() => {
    return (
      <div className="sessions-table-container">
        <DataTable
          value={sessions}
          className="sessions-datatable"
          emptyMessage={t(
            'no_sessions_found_with_filters',
            'No sessions found matching the filters'
          )}
          onRowClick={(e) => handleSessionClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={sessionFilters}
          onFilter={handleSessionFilterChange}
          filterDisplay="row"
          lazy={true}
          paginator={false}
          rows={pageSize}
        >
          <Column
            field="sessionId"
            header={t('session_id', 'Session ID')}
            headerClassName="col-xl"
            bodyClassName="col-xl"
            sortable
            filter
            filterPlaceholder={t(
              'filter_by_session_id',
              'Filter by Session ID'
            )}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="triggerAgentId"
            header={t('trigger_agent', 'Trigger Agent')}
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
            filter
            filterPlaceholder={t('filter_by_agent_id', 'Filter by Agent ID')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="agents"
            header={t('included_agents', 'Included Agents')}
            body={agentsBodyTemplate}
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
            filter
            filterPlaceholder={t(
              'filter_by_included_agents',
              'Filter by Included Agents'
            )}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="metadata.createdAt"
            header={t('started', 'Started At')}
            body={createDateTimeBodyTemplate('metadata.createdAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterElement={dateFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="metadata.modifiedAt"
            header={t('last_activity', 'Last Activity')}
            body={createDateTimeBodyTemplate('metadata.modifiedAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterElement={dateFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="severity"
            header={t('result', 'Result')}
            body={severityBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
            sortable
            filter
            filterElement={severityFilterElement}
            filterMatchMode={FilterMatchMode.EQUALS}
            showFilterMenu={false}
            showClearButton={false}
          />
        </DataTable>
        {(sessions.length > 0 || nextCursor || prevCursor) && (
          <CursorPaginator
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            rows={pageSize}
            isLoading={loading}
            onNext={goNext}
            onPrevious={goPrevious}
            onRowsChange={handleRowsChange}
          />
        )}
      </div>
    )
  }, [
    dateFilterElement,
    sessions,
    pageSize,
    nextCursor,
    prevCursor,
    loading,
    sessionFilters,
    sortField,
    sortOrder,
    handleSessionClick,
    handleSort,
    handleSessionFilterChange,
    goNext,
    goPrevious,
    handleRowsChange,
    severityFilterElement,
    t,
  ])

  if (!hasLoadedOnce && loading) {
    return (
      <div className="loading-state">
        <i className="pi pi-spin pi-spinner loading-spinner" />
        <p className="loading-text">
          {t('loading_sessions', 'Loading sessions...')}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <i className="pi pi-exclamation-triangle error-icon" />
        <p>{error}</p>
      </div>
    )
  }

  return <div className="sessions-tab">{renderSessionsTable}</div>
}

export default SessionsTab
