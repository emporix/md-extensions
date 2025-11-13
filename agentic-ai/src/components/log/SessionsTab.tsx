import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { FilterMatchMode } from 'primereact/api';
import { AppState } from '../../types/common';
import { useSessions } from '../../hooks/useSessions';
import { SessionLogs } from '../../types/Log';
import { formatTimestamp } from '../../utils/formatHelpers';
import { getLogLevelSeverity } from '../../utils/severityHelpers';
import { convertFiltersToApiFormat } from '../../utils/filterHelpers';

interface SessionsTabProps {
  appState: AppState;
  onSessionClick?: (sessionId: string, agentId: string) => void;
}

const SessionsTab: React.FC<SessionsTabProps> = ({ appState, onSessionClick }) => {
  const { t } = useTranslation();
  
  const {
    sessions,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    changePage,
    updateFilters: updateSessionFilters
  } = useSessions(appState);

  // PrimeReact filter state for sessions
  const [sessionFilters, setSessionFilters] = useState<DataTableFilterMeta>({
    sessionId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    triggerAgentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    agents: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'metadata.createdAt': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'metadata.modifiedAt': { value: null, matchMode: FilterMatchMode.CONTAINS },
    severity: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const handleSessionClick = useCallback((session: SessionLogs) => {
    if (onSessionClick) {
      onSessionClick(session.sessionId, session.triggerAgentId);
    }
  }, [onSessionClick]);

  const handlePageChange = useCallback((event: any) => {
    changePage(event.page + 1); // PrimeReact uses 0-based indexing
  }, [changePage]);

  // Handle session filter changes
  useEffect(() => {
    const apiFilters = convertFiltersToApiFormat(sessionFilters);
    updateSessionFilters(apiFilters);
  }, [sessionFilters, updateSessionFilters]);

  // Track initial load to prevent loading overlay on filter changes
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

  const severityBodyTemplate = (rowData: SessionLogs) => {
    return <Tag value={rowData.severity} severity={getLogLevelSeverity(rowData.severity)} />;
  };

  const agentsBodyTemplate = (rowData: SessionLogs) => {
    return rowData.agents.join(', ');
  };

  const createDateTimeBodyTemplate = (fieldPath: string) => {
    return (rowData: SessionLogs) => {
      const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], rowData as any);
      return formatTimestamp(value);
    };
  };

  const renderSessionsTable = () => {
    return (
      <div className="sessions-table-container">
        <DataTable 
          value={sessions} 
          className="sessions-datatable"
          emptyMessage={t('no_sessions_found_with_filters', 'No sessions found matching the filters')}
          onRowClick={(e) => handleSessionClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
          filters={sessionFilters}
          onFilter={(e) => setSessionFilters(e.filters as DataTableFilterMeta)}
          filterDisplay="row"
        >
          <Column 
            field="sessionId" 
            header={t('session_id', 'Session ID')} 
            headerClassName="col-xl"
            bodyClassName="col-xl"
            filter
            filterPlaceholder={t('filter_by_session_id', 'Filter by Session ID')}
            showFilterMenu={false}
          />
          <Column 
            field="triggerAgentId" 
            header={t('trigger_agent', 'Trigger Agent')} 
            headerClassName="col-md"
            bodyClassName="col-md"
            filter
            filterPlaceholder={t('filter_by_agent_id', 'Filter by Agent ID')}
            showFilterMenu={false}
          />
          <Column 
            field="agents" 
            header={t('included_agents', 'Included Agents')} 
            body={agentsBodyTemplate}
            headerClassName="col-lg"
            bodyClassName="col-lg"
            filter
            filterPlaceholder={t('filter_by_included_agents', 'Filter by Included Agents')}
            showFilterMenu={false}
          />
          <Column 
            field="metadata.createdAt" 
            header={t('started', 'Started At')} 
            body={createDateTimeBodyTemplate('metadata.createdAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            filter
            filterPlaceholder={t('filter_by_started_at', 'Filter by Started At')}
            showFilterMenu={false}
          />
          <Column 
            field="metadata.modifiedAt" 
            header={t('last_activity', 'Last Activity')} 
            body={createDateTimeBodyTemplate('metadata.modifiedAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
            filter
            filterPlaceholder={t('filter_by_last_activity', 'Filter by Last Activity')}
            showFilterMenu={false}
          />
          <Column 
            field="severity" 
            header={t('result', 'Result')} 
            body={severityBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
            filter
            filterPlaceholder={t('filter_by_severity', 'Filter by Severity')}
            showFilterMenu={false}
          />
        </DataTable>
        <Paginator
          first={(pageNumber - 1) * pageSize}
          rows={pageSize}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    );
  };

  // Only show loading on initial load, not on filter changes
  if (!hasLoadedOnce && loading) {
    return (
      <div className="loading-state">
        <i className="pi pi-spin pi-spinner loading-spinner" />
        <p className="loading-text">{t('loading_sessions', 'Loading sessions...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <i className="pi pi-exclamation-triangle error-icon" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="sessions-tab">
      {renderSessionsTable()}
    </div>
  );
};

export default SessionsTab;
