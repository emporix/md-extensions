import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { LogMessage } from '../../types/Log';
import { formatTimestamp } from '../../utils/formatHelpers';
import { getLogLevelSeverity } from '../../utils/severityHelpers';

interface UnifiedLogsTableProps {
  // Data props - messages array
  messages?: LogMessage[];
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  
  // Display options
  title?: string;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

const UnifiedLogsTable = forwardRef<any, UnifiedLogsTableProps>(({
  messages,
  loading = false,
  error = null,
  title,
  emptyMessage = 'No logs found',
  className = 'unified-logs-datatable',
  style = { width: '100%' }
}, ref) => {
  const { t } = useTranslation();

  const severityBodyTemplate = (rowData: LogMessage) => {
    const severity = getLogLevelSeverity(rowData.severity);
    return <Tag value={rowData.severity} severity={severity} />;
  };

  const timestampBodyTemplate = (rowData: LogMessage) => {
    return formatTimestamp(rowData.timestamp);
  };

  const messageBodyTemplate = (rowData: LogMessage) => {
    return (
      <div className="log-message-content">
        <span className="log-message-text">{rowData.message}</span>
      </div>
    );
  };

  const agentIdBodyTemplate = (rowData: LogMessage) => {
    return (
        rowData.agentId || ''
    );
  };

  // Use the messages prop directly
  const tableData = messages || [];

  // Show loading state
  if (loading) {
    return (
      <div className="unified-logs-section">
        {title && <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>}
        <div className="logs-loading loading-state">
          <ProgressSpinner />
          <span className="icon-with-text">{t('loading_logs', 'Loading logs...')}</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="unified-logs-section">
        {title && <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>}
        <Message severity="error" text={error} />
      </div>
    );
  }

  // Show empty state
  if (!tableData || tableData.length === 0) {
    return (
      <div className="unified-logs-section">
        {title && <h4 className="section-spacing-sm">{t('related_logs', title)}</h4>}
        <Message severity="info" text={t('no_logs_found', emptyMessage)} />
      </div>
    );
  }

  // Show table with data
  return (
    <div className="unified-logs-section">
      {title && <h4 style={{ marginBottom: '1rem' }}>{t('related_logs', title)}</h4>}
      <div className="unified-logs-table">
        <DataTable 
          ref={ref}
          value={tableData} 
          scrollable 
          scrollHeight="600px"
          className={className}
          emptyMessage={t('no_logs_found', emptyMessage)}
          style={style}
        >
          <Column 
            field="severity" 
            header={t('severity', 'Severity')} 
            body={severityBodyTemplate}
            headerClassName="col-severity"
            bodyClassName="col-severity"
          />
          <Column 
            field="timestamp" 
            header={t('timestamp', 'Timestamp')} 
            body={timestampBodyTemplate}
            headerClassName="col-timestamp"
            bodyClassName="col-timestamp"
          />
          <Column
            field="agentId"
            header={t('logs_agent_id', 'Agent ID')}
            body={agentIdBodyTemplate}
            headerClassName="col-agent"
            bodyClassName="col-agent"
          />
          <Column 
            field="message" 
            header={t('message', 'Message')} 
            body={messageBodyTemplate}
            headerClassName="col-message"
            bodyClassName="col-message"
          />
        </DataTable>
      </div>
    </div>
  );
});

UnifiedLogsTable.displayName = 'UnifiedLogsTable';

export default UnifiedLogsTable;
