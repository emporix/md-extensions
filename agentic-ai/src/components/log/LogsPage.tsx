import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { FilterMatchMode } from 'primereact/api';
import SessionsTab from './SessionsTab';
import { BasePage } from '../shared/BasePage';
import { LogSummary } from '../../types/Log';
import { JobSummary } from '../../types/Job';
import { useAgentLogs } from '../../hooks/useAgentLogs';
import { useJobs } from '../../hooks/useJobs';
import { AppState } from '../../types/common';
import { convertFiltersToApiFormat } from '../../utils/filterHelpers';

interface LogsPageProps {
  appState: AppState;
}

const LogsPage: React.FC<LogsPageProps> = ({ appState }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1);
  const [viewMode, setViewMode] = useState<'requests' | 'jobs' | 'sessions'>('requests');

  // Initialize view mode from route path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/logs/requests')) {
      setViewMode('requests');
    } else if (path.includes('/logs/jobs')) {
      setViewMode('jobs');
    } else if (path.includes('/logs/sessions')) {
      setViewMode('sessions');
    }
  }, [location.pathname]);

  const {
    logs,
    loading,
    error,
    pageSize: logsPageSize,
    pageNumber: logsPageNumber,
    totalRecords: logsTotalRecords,
    refreshLogs,
    sortLogs,
    changePage: changeLogsPage,
    updateFilters: updateLogFilters
  } = useAgentLogs(appState);

  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    pageSize: jobsPageSize,
    pageNumber: jobsPageNumber,
    totalRecords: jobsTotalRecords,
    refreshJobs,
    sortJobs,
    changePage: changeJobsPage,
    updateFilters: updateJobFilters
  } = useJobs(appState);

  // PrimeReact filter state for logs
  const [logFilters, setLogFilters] = useState<DataTableFilterMeta>({
    agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    requestId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    sessionId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lastActivity: { value: null, matchMode: FilterMatchMode.CONTAINS },
    errorCount: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // PrimeReact filter state for jobs
  const [jobFilters, setJobFilters] = useState<DataTableFilterMeta>({
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    agentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdAt: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });


  const handleLogClick = useCallback((log: LogSummary) => {
    navigate(`/logs/requests/${log.id}`);
  }, [navigate, location.search]);

  const handleJobClick = useCallback((job: JobSummary) => {
    navigate(`/logs/jobs/${job.id}`);
  }, [navigate, location.search]);

  const handleSessionClick = useCallback((sessionId: string) => {
    navigate(`/logs/sessions/${sessionId}`);
  }, [navigate]);

  const handleViewModeChange = useCallback((newMode: 'requests' | 'jobs' | 'sessions') => {
    setViewMode(newMode);
    setSortField('timestamp');
    setSortOrder(-1 as 1 | -1);
    
    navigate(`/logs/${newMode}`);
  }, [navigate, location.search]);

  const handleRefresh = useCallback(() => {
    // Get current agentId from URL
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    
    if (viewMode === 'requests') {
      refreshLogs(agentIdParam || undefined);
    } else {
      refreshJobs(agentIdParam || undefined);
    }
  }, [refreshLogs, refreshJobs, viewMode, location.search]);

  const handleSort = useCallback((event: any) => {
    const { sortField: newSortField } = event;
    
    // Map UI field names to API field names
    const fieldMapping: Record<string, string> = {
      'agentId': 'agentId',
      'requestId': 'requestId', 
      'sessionId': 'sessionId',
      'lastActivity': 'metadata.createdAt',
      'createdAt': 'metadata.createdAt'
    };
    
    const apiField = fieldMapping[newSortField] || newSortField;
    
    // Handle sort order logic
    let apiOrder: 'ASC' | 'DESC';
    if (newSortField === sortField) {
      // Same field - toggle between ASC and DESC
      if (sortOrder === 1) {
        apiOrder = 'DESC';
      } else {
        apiOrder = 'ASC';
      }
    } else {
      // New field - start with ASC
      apiOrder = 'ASC';
    }
    
    // Update local state
    setSortField(newSortField);
    setSortOrder(apiOrder === 'ASC' ? 1 : -1);
    
    // Get current agentId from URL for filtering
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    
    if (viewMode === 'requests') {
      sortLogs(apiField, apiOrder, agentIdParam || undefined);
    } else {
      sortJobs(apiField, apiOrder, agentIdParam || undefined);
    }
  }, [sortLogs, sortJobs, sortField, sortOrder, viewMode, location.search]);

  const handleLogsPageChange = useCallback((event: any) => {
    changeLogsPage(event.page + 1); // PrimeReact uses 0-based indexing
  }, [changeLogsPage]);

  const handleJobsPageChange = useCallback((event: any) => {
    changeJobsPage(event.page + 1); // PrimeReact uses 0-based indexing
  }, [changeJobsPage]);

  // Handle log filter changes
  useEffect(() => {
    const apiFilters = convertFiltersToApiFormat(logFilters, {
      errorCount: 'severity', 
      agentId: 'triggerAgentId',
    });
    updateLogFilters(apiFilters);
  }, [logFilters, updateLogFilters]);

  // Handle job filter changes
  useEffect(() => {
    const apiFilters = convertFiltersToApiFormat(jobFilters, {
      agentId: 'agentId', 
    });
    updateJobFilters(apiFilters);
  }, [jobFilters, updateJobFilters]);


  const formatTimestamp = (timestamp: string) => {
    try {
      const date = timestamp.includes('T') 
        ? new Date(timestamp)
        : new Date(parseInt(timestamp));
      
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const resultBodyTemplate = (rowData: LogSummary) => {
    if (rowData.errorCount > 0) {
      return <Tag value="ERROR" severity="danger" />;
    }
    return <Tag value="SUCCESS" severity="success" />;
  };

  const timestampBodyTemplate = (rowData: LogSummary) => {
    return formatTimestamp(rowData.lastActivity);
  };

  const jobStatusBodyTemplate = (rowData: JobSummary) => {
    const getSeverity = (status: string) => {
      switch (status) {
        case 'success':
          return 'info'; // Blue for finished
        case 'failure':
          return 'danger'; // Red for failure
        case 'in_progress':
          return 'warning'; // yellow for in progress
        default:
          return 'info';
      }
    };

    const getDisplayValue = (status: string) => {
      switch (status) {
        case 'success':
          return 'FINISHED';
        case 'failure':
          return 'FAILURE';
        case 'in_progress':
          return 'IN PROGRESS';
        default:
          return status.toUpperCase();
      }
    };

    return <Tag value={getDisplayValue(rowData.status)} severity={getSeverity(rowData.status)} />;
  };

  const jobTypeBodyTemplate = (rowData: JobSummary) => {
    const jobType = rowData.type || 'N/A';
    
    const getDisplayValue = (type: string) => {
      switch (type) {
        case 'import':
          return 'IMPORT';
        case 'export':
          return 'EXPORT';
        case 'agent_chat':
          return 'AGENT CHAT';
        default:
          return type.toUpperCase();
      }
    };

    return <span>{getDisplayValue(jobType)}</span>;
  };

  const jobTimestampBodyTemplate = (rowData: JobSummary) => {
    return formatTimestamp(rowData.createdAt);
  };

  const renderLogsTable = () => {
    return (
      <div className="logs-table-container">
        <DataTable 
          value={logs} 
          className="logs-datatable"
          emptyMessage={t('no_logs_found_with_filters', 'No logs found matching the filters')}
          onRowClick={(e) => handleLogClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={logFilters}
          onFilter={(e) => setLogFilters(e.filters as DataTableFilterMeta)}
          filterDisplay="row"
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
          />
          <Column 
            field="requestId" 
            header={t('request_id', 'Request ID')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
            filter
            filterPlaceholder={t('filter_by_request_id', 'Filter by Request ID')}
            showFilterMenu={false}
          />
          <Column 
            field="sessionId" 
            header={t('session_id', 'Session ID')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
            filter
            filterPlaceholder={t('filter_by_session_id', 'Filter by Session ID')}
            showFilterMenu={false}
          />
          <Column 
            field="lastActivity" 
            header={t('timestamp', 'Timestamp')} 
            body={timestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterPlaceholder={t('filter_by_timestamp', 'Filter by Timestamp')}
            showFilterMenu={false}
          />
          <Column 
            field="errorCount" 
            header={t('result', 'Result')} 
            body={resultBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
            filter
            filterPlaceholder={t('filter_by_error_count', 'Filter by Error Count')}
            showFilterMenu={false}
          />
        </DataTable>
        <Paginator
          first={(logsPageNumber - 1) * logsPageSize}
          rows={logsPageSize}
          totalRecords={logsTotalRecords}
          onPageChange={handleLogsPageChange}
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    );
  };

  const renderJobsTable = () => {
    return (
      <div className="logs-table-container">
        <DataTable 
          value={jobs} 
          className="logs-datatable"
          emptyMessage={t('no_jobs_found_with_filters', 'No jobs found matching the filters')}
          onRowClick={(e) => handleJobClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          filters={jobFilters}
          onFilter={(e) => setJobFilters(e.filters as DataTableFilterMeta)}
          filterDisplay="row"
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
          />
          <Column 
            field="type" 
            header={t('job_type', 'Job Type')} 
            body={jobTypeBodyTemplate}
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
            filter
            filterPlaceholder={t('filter_by_type', 'Filter by Type')}
            showFilterMenu={false}
          />
          <Column 
            field="createdAt" 
            header={t('created_at', 'Created At')} 
            body={jobTimestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
            filter
            filterPlaceholder={t('filter_by_created_at', 'Filter by Created At')}
            showFilterMenu={false}
          />
          <Column 
            field="status" 
            header={t('status', 'Status')} 
            body={jobStatusBodyTemplate}
            headerClassName="col-status-wide"
            bodyClassName="col-status-wide"
            sortable
            filter
            filterPlaceholder={t('filter_by_status', 'Filter by Status')}
            showFilterMenu={false}
          />
        </DataTable>
        <Paginator
          first={(jobsPageNumber - 1) * jobsPageSize}
          rows={jobsPageSize}
          totalRecords={jobsTotalRecords}
          onPageChange={handleJobsPageChange}
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    );
  };

  const renderViewSwitcher = () => {
    return (
      <div className="view-switcher">
        <button
          className={`view-tab ${viewMode === 'requests' ? 'view-tab-active' : ''}`}
          onClick={() => handleViewModeChange('requests')}
        >
          <i className="pi pi-list" />
          <span>{t('requests', 'Requests')}</span>
        </button>
        <button
          className={`view-tab ${viewMode === 'jobs' ? 'view-tab-active' : ''}`}
          onClick={() => handleViewModeChange('jobs')}
        >
          <i className="pi pi-briefcase" />
          <span>{t('jobs', 'Jobs')}</span>
        </button>
        <button
          className={`view-tab ${viewMode === 'sessions' ? 'view-tab-active' : ''}`}
          onClick={() => handleViewModeChange('sessions')}
        >
          <i className="pi pi-users" />
          <span>{t('sessions', 'Sessions')}</span>
        </button>
      </div>
    );
  };

  // Track initial load to prevent loading overlay on filter changes
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  useEffect(() => {
    const isCurrentViewLoaded = viewMode === 'requests' ? !loading : !jobsLoading;
    if (isCurrentViewLoaded) {
      setHasLoadedOnce(true);
    }
  }, [loading, jobsLoading, viewMode]);

  // Reset hasLoadedOnce when view mode changes
  useEffect(() => {
    setHasLoadedOnce(false);
  }, [viewMode]);

  const currentLoading = !hasLoadedOnce && (viewMode === 'requests' ? loading : jobsLoading);
  const currentError = viewMode === 'requests' ? error : jobsError;

  return (
    <BasePage
      loading={currentLoading}
      error={currentError}
      title={t('agent_logs', 'Agent Logs')}
      addButtonLabel={t('refresh', 'Refresh')}
      onAdd={handleRefresh}
      className="logs"
    >
      {renderViewSwitcher()}
      
      {viewMode === 'requests' ? renderLogsTable() : 
       viewMode === 'jobs' ? renderJobsTable() : 
       <SessionsTab appState={appState} onSessionClick={handleSessionClick} />}

    </BasePage>
  );
};

export default LogsPage;
