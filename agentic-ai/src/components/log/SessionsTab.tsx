import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { AppState } from '../../types/common';
import { useSessions } from '../../hooks/useSessions';
import { SessionLogs } from '../../types/Log';
import { formatTimestamp } from '../../utils/formatHelpers';
import { getLogLevelSeverity } from '../../utils/severityHelpers';

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
    changePage
  } = useSessions(appState);

  const handleSessionClick = useCallback((session: SessionLogs) => {
    if (onSessionClick) {
      onSessionClick(session.sessionId, session.triggerAgentId);
    }
  }, [onSessionClick]);

  const handlePageChange = useCallback((event: any) => {
    changePage(event.page + 1); // PrimeReact uses 0-based indexing
  }, [changePage]);

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
    if (sessions.length === 0) {
      return (
        <div className="empty-state">
          <i className="pi pi-calendar empty-state-icon" />
          <p>{t('no_sessions_available', 'No sessions available')}</p>
        </div>
      );
    }

    return (
      <div className="sessions-table-container">
        <DataTable 
          value={sessions} 
          className="sessions-datatable"
          emptyMessage={t('no_sessions_available', 'No sessions available')}
          onRowClick={(e) => handleSessionClick(e.data)}
          selectionMode="single"
          metaKeySelection={false}
          sortMode="single"
        >
          <Column 
            field="sessionId" 
            header={t('session_id', 'Session ID')} 
            headerClassName="col-xl"
            bodyClassName="col-xl"
          />
          <Column 
            field="triggerAgentId" 
            header={t('trigger_agent', 'Trigger Agent')} 
            headerClassName="col-md"
            bodyClassName="col-md"
          />
          <Column 
            field="agents" 
            header={t('included_agents', 'Included Agents')} 
            body={agentsBodyTemplate}
            headerClassName="col-lg"
            bodyClassName="col-lg"
          />
          <Column 
            field="metadata.createdAt" 
            header={t('started', 'Started At')} 
            body={createDateTimeBodyTemplate('metadata.createdAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
          />
          <Column 
            field="metadata.modifiedAt" 
            header={t('last_activity', 'Last Activity')} 
            body={createDateTimeBodyTemplate('metadata.modifiedAt')}
            headerClassName="col-datetime"
            bodyClassName="col-datetime"
          />
          <Column 
            field="severity" 
            header={t('result', 'Result')} 
            body={severityBodyTemplate}
            headerClassName="col-result"
            bodyClassName="col-result"
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

  if (loading) {
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
