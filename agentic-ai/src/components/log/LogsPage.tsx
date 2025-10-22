import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ToggleButton } from 'primereact/togglebutton';
import { Paginator } from 'primereact/paginator';
import SessionsTab from './SessionsTab';
import { BasePage } from '../shared/BasePage';
import { LogSummary } from '../../types/Log';
import { JobSummary } from '../../types/Job';
import { useAgentLogs } from '../../hooks/useAgentLogs';
import { useJobs } from '../../hooks/useJobs';
import { AppState } from '../../types/common';

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
    changePage: changeLogsPage
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
    changePage: changeJobsPage
  } = useJobs(appState);


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
      'lastActivity': 'metadata.createdAt'
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

  const jobTimestampBodyTemplate = (rowData: JobSummary) => {
    return formatTimestamp(rowData.createdAt);
  };

  const renderLogsTable = () => {
    if (logs.length === 0) {
      return (
        <div className="empty-state">
          <i className="pi pi-file empty-state-icon" />
          <p>{t('no_logs_available', 'No logs available')}</p>
          <Button
            label={t('refresh', 'Refresh')}
            icon="pi pi-refresh"
            className="p-button-text"
            onClick={handleRefresh}
          />
        </div>
      );
    }

    return (
      <div className="logs-table-container">
        <DataTable 
          value={logs} 
          className="logs-datatable"
          emptyMessage={t('no_logs_available', 'No logs available')}
          onRowClick={(e) => handleLogClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <Column 
            field="agentId" 
            header={t('logs_agent_id', 'Agent ID')} 
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
          />
          <Column 
            field="requestId" 
            header={t('request_id', 'Request ID')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
          />
          <Column 
            field="sessionId" 
            header={t('session_id', 'Session ID')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
          />
          <Column 
            field="lastActivity" 
            header={t('timestamp', 'Timestamp')} 
            body={timestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
          />
          <Column 
            field="errorCount" 
            header={t('result', 'Result')} 
            body={resultBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
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
    if (jobs.length === 0) {
      return (
        <div className="empty-state">
          <i className="pi pi-briefcase empty-state-icon" />
          <p>{t('no_jobs_available', 'No jobs available')}</p>
          <Button
            label={t('refresh', 'Refresh')}
            icon="pi pi-refresh"
            className="p-button-text"
            onClick={handleRefresh}
          />
        </div>
      );
    }

    return (
      <div className="logs-table-container">
        <DataTable 
          value={jobs} 
          className="logs-datatable"
          emptyMessage={t('no_jobs_available', 'No jobs available')}
          onRowClick={(e) => handleJobClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <Column 
            field="id" 
            header={t('job_id', 'Job ID')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
          />
          <Column 
            field="agentId" 
            header={t('logs_agent_id', 'Agent ID')} 
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
          />
          <Column 
            field="agentType" 
            header={t('agent_type', 'Agent Type')} 
            headerClassName="col-md"
            bodyClassName="col-md"
            sortable
          />
          <Column 
            field="commerceEvent" 
            header={t('commerce_event', 'Commerce Event')} 
            headerClassName="col-lg"
            bodyClassName="col-lg"
            sortable
          />
          <Column 
            field="createdAt" 
            header={t('created_at', 'Created At')} 
            body={jobTimestampBodyTemplate}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            sortable
          />
          <Column 
            field="status" 
            header={t('status', 'Status')} 
            body={jobStatusBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
            sortable
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
        <ToggleButton
          checked={viewMode === 'requests'}
          onChange={() => handleViewModeChange('requests')}
          onLabel={t('requests', 'Requests')}
          offLabel={t('requests', 'Requests')}
          className="p-button-outlined"
        />
        <ToggleButton
          checked={viewMode === 'jobs'}
          onChange={() => handleViewModeChange('jobs')}
          onLabel={t('jobs', 'Jobs')}
          offLabel={t('jobs', 'Jobs')}
          className="p-button-outlined"
        />
        <ToggleButton
          checked={viewMode === 'sessions'}
          onChange={() => handleViewModeChange('sessions')}
          onLabel={t('sessions', 'Sessions')}
          offLabel={t('sessions', 'Sessions')}
          className="p-button-outlined"
        />
      </div>
    );
  };

  const currentLoading = viewMode === 'requests' ? loading : jobsLoading;
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
