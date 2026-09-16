import React, { useState, useCallback, useEffect, useMemo } from 'react'
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
import { TabView, TabPanel, TabViewTabChangeParams } from 'primereact/tabview'
import SessionsTab from './SessionsTab'
import { BasePage } from '../shared/BasePage'
import { SeverityBadge } from '../shared/SeverityBadge'
import { StatusBadge } from '../shared/StatusBadge'
import DateFilterTemplate from '../shared/DateFilterTemplate'
import MetricsPanel from '../shared/MetricsPanel'
import CursorPaginator from '../shared/CursorPaginator'
import { LogSummary } from '../../types/Log'
import { JobSummary } from '../../types/Job'
import { useAgentLogs } from '../../hooks/useAgentLogs'
import { useJobs } from '../../hooks/useJobs'
import { useSessions } from '../../hooks/useSessions'
import { useAppState } from '../../contexts/AppStateContext'
import { getCustomAgents } from '../../services/agentService'
import { getLocalizedValue } from '../../utils/agentHelpers'
import {
  SEVERITY_OPTIONS,
  JOB_TYPE_OPTIONS,
  JOB_STATUS_OPTIONS,
  getJobTypeDisplay,
  convertJobTypeToApi,
} from '../../constants/logConstants'
import {
  convertSeverityFiltersToApi,
  handleDataTableSort,
} from '../../utils/dataTableHelpers'
import { normalizeDuration } from '../../utils/formatHelpers'

const LogsPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [sortField, setSortField] = useState<string>('lastActivity')
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [viewMode, setViewMode] = useState<'requests' | 'jobs' | 'sessions'>(
    'requests'
  )
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [metricsRefreshTrigger, setMetricsRefreshTrigger] = useState(0)
  const [agentName, setAgentName] = useState<string | null>(null)

  useEffect(() => {
    const path = location.pathname
    if (path.includes('/logs/requests')) {
      setViewMode('requests')
      setActiveTabIndex(0)
      setSortField('lastActivity')
    } else if (path.includes('/logs/jobs')) {
      setViewMode('jobs')
      setActiveTabIndex(1)
      setSortField('createdAt')
    } else if (path.includes('/logs/sessions')) {
      setViewMode('sessions')
      setActiveTabIndex(2)
    }
  }, [location.pathname])

  // Fetch agent name when agentId is in URL
  useEffect(() => {
    const fetchAgentName = async () => {
      const urlParams = new URLSearchParams(location.search)
      const agentIdParam = urlParams.get('agentId')

      if (!agentIdParam) {
        setAgentName(null)
        return
      }

      try {
        const agents = await getCustomAgents(appState)
        const agent = agents.find((a) => a.id === agentIdParam)
        setAgentName(
          agent ? getLocalizedValue(agent.name, appState.contentLanguage) : null
        )
      } catch {
        setAgentName(null)
      }
    }

    fetchAgentName()
  }, [location.search, appState])

  const {
    logs,
    loading,
    error,
    pageSize: logsPageSize,
    nextCursor: logsNextCursor,
    prevCursor: logsPrevCursor,
    refreshLogs,
    sortLogs,
    changePageSize: changeLogsPageSize,
    updateFilters: updateLogFilters,
    goNext: goLogsNext,
    goPrevious: goLogsPrevious,
  } = useAgentLogs()

  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    pageSize: jobsPageSize,
    nextCursor: jobsNextCursor,
    prevCursor: jobsPrevCursor,
    refreshJobs,
    sortJobs,
    changePageSize: changeJobsPageSize,
    updateFilters: updateJobFilters,
    goNext: goJobsNext,
    goPrevious: goJobsPrevious,
  } = useJobs()

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    pageSize: sessionsPageSize,
    nextCursor: sessionsNextCursor,
    prevCursor: sessionsPrevCursor,
    refreshSessions,
    sortSessions,
    changePageSize: changeSessionsPageSize,
    updateFilters: updateSessionFilters,
    goNext: goSessionsNext,
    goPrevious: goSessionsPrevious,
  } = useSessions()

  // PrimeReact filter state for logs
  const [logFilters, setLogFilters] = useState<DataTableFilterMeta>({
    agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    requestId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    sessionId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lastActivity: { value: null, matchMode: FilterMatchMode.CONTAINS },
    duration: { value: null, matchMode: FilterMatchMode.CONTAINS },
    severity: { value: null, matchMode: FilterMatchMode.EQUALS },
  })

  // PrimeReact filter state for jobs
  const [jobFilters, setJobFilters] = useState<DataTableFilterMeta>({
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdAt: { value: null, matchMode: FilterMatchMode.CONTAINS },
  })

  const handleLogClick = useCallback(
    (log: LogSummary) => {
      navigate(`/logs/requests/${log.id}`)
    },
    [navigate]
  )

  const handleJobClick = useCallback(
    (job: JobSummary) => {
      navigate(`/logs/jobs/${job.id}`)
    },
    [navigate]
  )

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      const urlParams = new URLSearchParams(location.search)
      const agentIdParam = urlParams.get('agentId')
      const queryString = agentIdParam ? `?agentId=${agentIdParam}` : ''
      navigate(`/logs/sessions/${sessionId}${queryString}`)
    },
    [navigate, location.search]
  )

  const handleViewModeChange = useCallback(
    (newMode: 'requests' | 'jobs' | 'sessions') => {
      setViewMode(newMode)
      const index = newMode === 'requests' ? 0 : newMode === 'jobs' ? 1 : 2
      setActiveTabIndex(index)

      const defaultSortField =
        newMode === 'requests' ? 'lastActivity' : 'createdAt'
      setSortField(defaultSortField)
      setSortOrder(-1 as 1 | -1)

      navigate(`/logs/${newMode}`)
    },
    [navigate]
  )

  const handleTabChange = useCallback(
    (e: TabViewTabChangeParams) => {
      const newIndex = e.index
      setActiveTabIndex(newIndex)
      const newMode =
        newIndex === 0 ? 'requests' : newIndex === 1 ? 'jobs' : 'sessions'
      handleViewModeChange(newMode)
    },
    [handleViewModeChange]
  )

  const handleRefresh = useCallback(() => {
    // Get current agentId from URL
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')

    if (viewMode === 'requests') {
      refreshLogs(agentIdParam || undefined)
    } else if (viewMode === 'jobs') {
      refreshJobs(agentIdParam || undefined)
    } else if (viewMode === 'sessions') {
      refreshSessions(agentIdParam || '')
    }

    // Trigger metrics refresh (force cache refresh)
    setMetricsRefreshTrigger((prev) => prev + 1)
  }, [refreshLogs, refreshJobs, refreshSessions, viewMode, location.search])

  const handleSort = useCallback(
    (event: DataTablePFSEvent) => {
      // Different mappings for requests vs jobs
      const fieldMapping: Record<string, string> =
        viewMode === 'requests'
          ? {
              agentId: 'triggerAgentId',
              requestId: 'requestId',
              sessionId: 'sessionId',
              lastActivity: 'metadata.createdAt',
              createdAt: 'metadata.createdAt',
              duration: 'duration',
              severity: 'severity',
            }
          : {
              agentId: 'agentId',
              requestId: 'requestId',
              sessionId: 'sessionId',
              lastActivity: 'metadata.createdAt',
              createdAt: 'metadata.createdAt',
            }

      // Use helper to handle sort logic
      const [apiField, apiOrder, newSortField, newSortOrder] =
        handleDataTableSort(event, sortField, sortOrder, fieldMapping)

      // Update local state
      setSortField(newSortField)
      setSortOrder(newSortOrder)

      if (viewMode === 'requests') {
        sortLogs(apiField, apiOrder)
      } else {
        sortJobs(apiField, apiOrder)
      }
    },
    [sortLogs, sortJobs, sortField, sortOrder, viewMode]
  )

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = timestamp.includes('T')
        ? new Date(timestamp)
        : new Date(parseInt(timestamp))

      return date.toLocaleString()
    } catch {
      return timestamp
    }
  }

  const resultBodyTemplate = (rowData: LogSummary) => {
    return <SeverityBadge severity={rowData.severity} />
  }

  const durationBodyTemplate = (rowData: LogSummary) => {
    if (rowData.duration == null) return '—'
    return t('duration_seconds', { count: normalizeDuration(rowData.duration) })
  }

  const severityFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => {
      const placeholderText = t('select_severity', 'Select Severity')
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

  const jobTypeFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => {
      return (
        <Dropdown
          value={options.value}
          options={JOB_TYPE_OPTIONS}
          valueTemplate={(option) => {
            if (!option) return null
            return <span>{option.label}</span>
          }}
          onChange={(e) => options.filterApplyCallback(e.value)}
          itemTemplate={(option) => <span>{option.label}</span>}
          placeholder={t('select_job_type', 'Select Job Type')}
          className="p-column-filter filter-dropdown-wide"
          showClear
        />
      )
    },
    [t]
  )

  const jobStatusFilterElement = useCallback(
    (options: ColumnFilterElementTemplateOptions) => {
      const placeholderText = t('select_status', 'Select Status')
      return (
        <Dropdown
          value={options.value}
          options={JOB_STATUS_OPTIONS}
          valueTemplate={(option) => {
            if (!option)
              return (
                <span className="dropdown-placeholder">{placeholderText}</span>
              )
            return <StatusBadge status={option.value} />
          }}
          onChange={(e) => options.filterApplyCallback(e.value)}
          itemTemplate={(option) => <StatusBadge status={option.value} />}
          placeholder={placeholderText}
          className="p-column-filter filter-dropdown-wide"
          showClear
        />
      )
    },
    [t]
  )

  const timestampBodyTemplate = useMemo(
    () => (rowData: LogSummary) => formatTimestamp(rowData.lastActivity),
    []
  )

  const jobStatusBodyTemplate = useCallback(
    (rowData: JobSummary) => <StatusBadge status={rowData.status} />,
    []
  )

  const jobTypeBodyTemplate = useCallback(
    (rowData: JobSummary) => (
      <span>{getJobTypeDisplay(rowData.type || 'N/A')}</span>
    ),
    []
  )

  const jobTimestampBodyTemplate = useCallback(
    (rowData: JobSummary) => formatTimestamp(rowData.createdAt),
    []
  )

  // Memoize filter change handlers to prevent unnecessary re-renders
  const handleLogFilterChange = useCallback(
    (e: DataTablePFSEvent) => {
      const nextFilters = e.filters as DataTableFilterMeta
      setLogFilters(nextFilters)
      const apiFilters = convertSeverityFiltersToApi(
        nextFilters,
        {
          agentId: 'triggerAgentId',
          lastActivity: 'metadata.createdAt',
        },
        ['lastActivity']
      )
      updateLogFilters(apiFilters)
    },
    [updateLogFilters]
  )

  const handleJobFilterChange = useCallback(
    (e: DataTablePFSEvent) => {
      const nextFilters = e.filters as DataTableFilterMeta
      setJobFilters(nextFilters)
      const apiFilters = convertSeverityFiltersToApi(
        nextFilters,
        {
          createdAt: 'metadata.createdAt',
        },
        ['createdAt']
      )

      Object.entries(nextFilters).forEach(([key, filterMeta]) => {
        if (
          filterMeta &&
          typeof filterMeta === 'object' &&
          'value' in filterMeta
        ) {
          const value = filterMeta.value
          if (value !== null && value !== undefined && String(value).trim()) {
            if (key === 'type') {
              apiFilters[key] = convertJobTypeToApi(String(value).trim())
            }
          }
        }
      })

      updateJobFilters(apiFilters)
    },
    [updateJobFilters]
  )

  const renderLogsTable = useMemo(() => {
    return (
      <div className="logs-table-container">
        <DataTable
          value={logs}
          className="logs-datatable"
          emptyMessage={t(
            'no_logs_found_with_filters',
            'No logs found matching the filters'
          )}
          onRowClick={(e) => handleLogClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={logFilters}
          onFilter={handleLogFilterChange}
          filterDisplay="row"
          lazy={true}
          paginator={false}
          rows={logsPageSize}
        >
          <Column
            field="agentId"
            header={t('logs_agent_id', 'Agent ID')}
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
            filter
            filterPlaceholder={t('filter_by_agent_id', 'Filter by Agent ID')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="requestId"
            header={t('request_id', 'Request ID')}
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
            filter
            filterPlaceholder={t(
              'filter_by_request_id',
              'Filter by Request ID'
            )}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="sessionId"
            header={t('session_id', 'Session ID')}
            headerClassName="col-lg"
            bodyClassName="col-lg"
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
            field="lastActivity"
            header={t('timestamp', 'Timestamp')}
            body={timestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterElement={dateFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="duration"
            header={t('duration')}
            body={durationBodyTemplate}
            headerClassName="col-sm"
            bodyClassName="col-sm"
            sortable
            filter
            filterPlaceholder={t('filter_by_duration')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="severity"
            header={t('severity', 'Severity')}
            body={resultBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
            sortable
            filter
            filterMatchMode={FilterMatchMode.EQUALS}
            filterElement={severityFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
        </DataTable>
        {(logs.length > 0 || logsNextCursor || logsPrevCursor) && (
          <CursorPaginator
            nextCursor={logsNextCursor}
            prevCursor={logsPrevCursor}
            rows={logsPageSize}
            isLoading={loading}
            onNext={goLogsNext}
            onPrevious={goLogsPrevious}
            onRowsChange={changeLogsPageSize}
          />
        )}
      </div>
    )
  }, [
    dateFilterElement,
    timestampBodyTemplate,
    logs,
    logsPageSize,
    logsNextCursor,
    logsPrevCursor,
    loading,
    logFilters,
    sortField,
    sortOrder,
    handleLogClick,
    handleSort,
    handleLogFilterChange,
    goLogsNext,
    goLogsPrevious,
    changeLogsPageSize,
    severityFilterElement,
    t,
  ])

  const renderJobsTable = useMemo(() => {
    return (
      <div className="logs-table-container">
        <DataTable
          value={jobs}
          className="logs-datatable"
          emptyMessage={t(
            'no_jobs_found_with_filters',
            'No jobs found matching the filters'
          )}
          onRowClick={(e) => handleJobClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={jobFilters}
          onFilter={handleJobFilterChange}
          filterDisplay="row"
          lazy={true}
          paginator={false}
          rows={jobsPageSize}
        >
          <Column
            field="id"
            header={t('job_id', 'Job ID')}
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
            filter
            filterPlaceholder={t('filter_by_job_id', 'Filter by Job ID')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="agentId"
            header={t('logs_agent_id', 'Agent ID')}
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
            filter
            filterPlaceholder={t('filter_by_agent_id', 'Filter by Agent ID')}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="type"
            header={t('job_type', 'Job Type')}
            body={jobTypeBodyTemplate}
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
            filter
            filterElement={jobTypeFilterElement}
            filterMatchMode={FilterMatchMode.EQUALS}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="createdAt"
            header={t('created_at', 'Created At')}
            body={jobTimestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterElement={dateFilterElement}
            showFilterMenu={false}
            showClearButton={false}
          />
          <Column
            field="status"
            header={t('status', 'Status')}
            body={jobStatusBodyTemplate}
            headerClassName="col-status-wide"
            bodyClassName="col-status-wide"
            sortable
            filter
            filterElement={jobStatusFilterElement}
            filterMatchMode={FilterMatchMode.EQUALS}
            showFilterMenu={false}
            showClearButton={false}
          />
        </DataTable>
        {(jobs.length > 0 || jobsNextCursor || jobsPrevCursor) && (
          <CursorPaginator
            nextCursor={jobsNextCursor}
            prevCursor={jobsPrevCursor}
            rows={jobsPageSize}
            isLoading={jobsLoading}
            onNext={goJobsNext}
            onPrevious={goJobsPrevious}
            onRowsChange={changeJobsPageSize}
          />
        )}
      </div>
    )
  }, [
    jobs,
    jobsPageSize,
    jobsNextCursor,
    jobsPrevCursor,
    jobsLoading,
    jobFilters,
    sortField,
    sortOrder,
    dateFilterElement,
    handleJobClick,
    handleSort,
    handleJobFilterChange,
    goJobsNext,
    goJobsPrevious,
    changeJobsPageSize,
    jobStatusFilterElement,
    jobStatusBodyTemplate,
    jobTypeFilterElement,
    jobTypeBodyTemplate,
    jobTimestampBodyTemplate,
    t,
  ])

  // Track initial load to prevent loading overlay on filter changes
  // Once data has loaded, never show loading overlay again (even on filter/pagination changes)
  const [hasLoadedOnce, setHasLoadedOnce] = useState<
    Record<'requests' | 'jobs', boolean>
  >({
    requests: false,
    jobs: false,
  })

  // Mark as loaded when data first arrives (only once per view mode)
  useEffect(() => {
    if (viewMode === 'requests' && !loading && !hasLoadedOnce.requests) {
      setHasLoadedOnce((prev) => ({ ...prev, requests: true }))
    }
  }, [loading, viewMode, hasLoadedOnce.requests])

  useEffect(() => {
    if (viewMode === 'jobs' && !jobsLoading && !hasLoadedOnce.jobs) {
      setHasLoadedOnce((prev) => ({ ...prev, jobs: true }))
    }
  }, [jobsLoading, viewMode, hasLoadedOnce.jobs])

  // Only show loading on initial load, never on filter/pagination changes
  const currentLoading = useMemo(() => {
    if (viewMode === 'requests') {
      return !hasLoadedOnce.requests && loading
    } else {
      return !hasLoadedOnce.jobs && jobsLoading
    }
  }, [viewMode, hasLoadedOnce, loading, jobsLoading])

  const currentError = viewMode === 'requests' ? error : jobsError

  // Determine title based on whether agent name is available
  const pageTitle = agentName
    ? `${agentName} ${t('logs', 'Logs')}`
    : t('agent_logs', 'Agent Logs')

  // Check if agentId is in URL to show back button
  const urlParams = new URLSearchParams(location.search)
  const agentIdParam = urlParams.get('agentId')
  const hasAgentId = !!agentIdParam

  const handleBackToAgents = useCallback(() => {
    navigate('/agents')
  }, [navigate])

  return (
    <BasePage
      loading={currentLoading}
      error={currentError}
      title={pageTitle}
      refreshButtonLabel={t('refresh', 'Refresh')}
      onRefresh={handleRefresh}
      backButtonLabel={
        hasAgentId ? t('back_to_agents', 'Back to Agents') : undefined
      }
      onBack={hasAgentId ? handleBackToAgents : undefined}
      className="logs"
    >
      {/* Metrics Panel - Show on all tabs */}
      <MetricsPanel refreshTrigger={metricsRefreshTrigger} />

      <TabView activeIndex={activeTabIndex} onTabChange={handleTabChange}>
        <TabPanel header={t('requests', 'Requests')}>
          {renderLogsTable}
        </TabPanel>
        <TabPanel header={t('jobs', 'Jobs')}>{renderJobsTable}</TabPanel>
        <TabPanel header={t('sessions', 'Sessions')}>
          <SessionsTab
            onSessionClick={handleSessionClick}
            sessions={sessions}
            loading={sessionsLoading}
            error={sessionsError}
            pageSize={sessionsPageSize}
            nextCursor={sessionsNextCursor}
            prevCursor={sessionsPrevCursor}
            changePageSize={changeSessionsPageSize}
            updateFilters={updateSessionFilters}
            sortSessions={sortSessions}
            goNext={goSessionsNext}
            goPrevious={goSessionsPrevious}
          />
        </TabPanel>
      </TabView>
    </BasePage>
  )
}

export default LogsPage
