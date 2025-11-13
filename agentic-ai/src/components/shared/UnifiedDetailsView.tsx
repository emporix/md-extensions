import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'primereact/tag';
import { BasePage, UnifiedLogsTable } from './index';
import { LogMessage } from '../../types/Log';
import { ImportResultSummary, ExportResult } from '../../types/Job';
import { formatTimestamp, calculateDuration } from '../../utils/formatHelpers';
import { getStatusSeverity, getStatusDisplayValue } from '../../utils/severityHelpers';
import { useScrollToMessage } from '../../hooks/useScrollToMessage';

interface UnifiedDetailsViewProps {
  // Common props
  title: string;
  backButtonText: string;
  onBack: () => void;
  className?: string;
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  
  // Basic info props
  agentId?: string;
  sessionId?: string;
  requestId?: string;
  createdAt?: string | null;
  
  // Status props
  status?: string;
  
  // Job type props
  jobType?: 'import' | 'export' | 'agent_chat';
  importResult?: ImportResultSummary;
  exportResult?: ExportResult;
  
  // Message and response props
  message?: string;
  response?: string;
  
  // Log messages props
  messages?: LogMessage[];
  scrollToMessage?: string;
}

const UnifiedDetailsView: React.FC<UnifiedDetailsViewProps> = ({
  title,
  backButtonText,
  onBack,
  className = '',
  loading = false,
  error = null,
  agentId,
  sessionId,
  requestId,
  createdAt,
  status,
  jobType,
  importResult,
  exportResult,
  message,
  response,
  messages,
  scrollToMessage,
}) => {
  const { t } = useTranslation();
  const dataTableRef = useRef<any>(null);

  // Use the custom hook for scroll-to-message functionality
  useScrollToMessage(dataTableRef, messages, scrollToMessage, true);

  const statusBodyTemplate = (status: string) => {
    return <Tag value={getStatusDisplayValue(status)} severity={getStatusSeverity(status)} />;
  };


  const hasErrorLogs = messages && messages.some((message: LogMessage) => message.severity === 'ERROR');

  const getTitleWithStatus = () => {

      return (
        <div className="flex items-center gap-2">
          <span>{title}</span>
          <i 
            className={`pi ${hasErrorLogs ? 'pi-times-circle' : 'pi-check-circle'} status-icon-lg ${hasErrorLogs ? 'status-icon-error' : 'status-icon-success'}`}
          />
        </div>
      );
  };

  // Determine which type of data we're displaying
  const hasMessages = !!messages && messages.length > 0;

  // Create title with back button
  const titleWithBackButton = (
    <div className="details-title-with-back">
      <button 
        onClick={onBack}
        className="details-back-button"
        aria-label={backButtonText}
      >
        <i className="pi pi-arrow-left" />
      </button>
      <span className="details-title-text">{getTitleWithStatus()}</span>
    </div>
  );

  if (loading) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={titleWithBackButton}
        className={className}
      >
        <div className="loading-state">
          <div>Loading...</div>
          <p className="loading-text">Loading details...</p>
        </div>
      </BasePage>
    );
  }

  if (error) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={titleWithBackButton}
        className={className}
      >
        <div className="error-state">
          {error}
        </div>
      </BasePage>
    );
  }

  if (!agentId && !sessionId && !requestId) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={titleWithBackButton}
        className={className}
      >
        <div className="empty-state">
          No data available
        </div>
      </BasePage>
    );
  }

  // Sort messages by timestamp for log details
  const sortedMessages = messages ? [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ) : [];

  return (
    <BasePage
      loading={false}
      error={null}
      title={titleWithBackButton}
      className={className}
    >
      <div className="details-content">
        <div className="details-header">
          <div className="details-info-grid">
            {agentId && (
              <div className="info-card">
                <div className="info-label">{t('logs_agent_id', 'Agent ID')}</div>
                <div className="info-value">{agentId}</div>
              </div>
            )}
            {sessionId && (
              <div className="info-card">
                <div className="info-label">{t('session_id', 'Session ID')}</div>
                <div className="info-value">{sessionId}</div>
              </div>
            )}
            {requestId && (
              <div className="info-card">
                <div className="info-label">{t('request_id', 'Request ID')}</div>
                <div className="info-value">{requestId}</div>
              </div>
            )}
            {jobType && (
              <div className="info-card">
                <div className="info-label">{t('job_type', 'Job Type')}</div>
                <div className="info-value">{jobType.toUpperCase().replace('_', ' ')}</div>
              </div>
            )}
            {messages && messages.length > 0 && (
              <div className="info-card">
                <div className="info-label">{t('duration', 'Duration')}</div>
                <div className="info-value">{calculateDuration(messages)}</div>
              </div>
            )}
            {createdAt && (
              <div className="info-card">
                <div className="info-label">{t('created_at', 'Created At')}</div>
                <div className="info-value">{formatTimestamp(createdAt)}</div>
              </div>
            )}
            {status && (
              <div className="info-card">
                <div className="info-label">{t('status', 'Status')}</div>
                <div className="info-value-tag">{statusBodyTemplate(status)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Message and Response sections */}
        {message && (
          <div className="content-section">
            <div className="section-header">
              <i className="pi pi-inbox section-icon" />
              <h3 className="section-title">{t('message', 'Message')}</h3>
            </div>
            <div className="content-box">
              <pre className="content-text">{message}</pre>
            </div>
          </div>
        )}

        {response && (
          <div className="content-section">
            <div className="section-header">
              <i className="pi pi-send section-icon" />
              <h3 className="section-title">{t('response', 'Response')}</h3>
            </div>
            <div className="content-box">
              <pre className="content-text">{response}</pre>
            </div>
          </div>
        )}

        {/* Import result section */}
        {importResult && (
          <div className="content-section">
            <div className="section-header">
              <i className="pi pi-download section-icon" />
              <h3 className="section-title">{t('import_result', 'Import Result')}</h3>
            </div>
            <div className="content-box">
              {importResult.summary && (
                <div className="result-summary">
                  <div className="summary-title">{t('summary', 'Summary')}</div>
                  <div className="summary-grid">
                    {importResult.summary.agents && importResult.summary.agents.length > 0 && (
                      <div className="summary-item">
                        <div className="summary-item-header">
                          <i className="pi pi-users" />
                          <span>{t('agents', 'Agents')} ({importResult.summary.agents.length})</span>
                        </div>
                        <ul className="summary-list">
                          {importResult.summary.agents.map((agent, idx) => (
                            <li key={idx} className="summary-list-item">
                              <span className="item-name">{agent.name}</span>
                              <span className="item-detail">ID: {agent.id}</span>
                              <span className={`item-state state-${agent.state.toLowerCase().replace('_', '-')}`}>{agent.state}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {importResult.summary.tools && importResult.summary.tools.length > 0 && (
                      <div className="summary-item">
                        <div className="summary-item-header">
                          <i className="pi pi-wrench" />
                          <span>{t('tools', 'Tools')} ({importResult.summary.tools.length})</span>
                        </div>
                        <ul className="summary-list">
                          {importResult.summary.tools.map((tool, idx) => (
                            <li key={idx} className="summary-list-item">
                              <span className="item-name">{tool.name}</span>
                              <span className="item-detail">ID: {tool.id}</span>
                              <span className={`item-state state-${tool.state.toLowerCase().replace('_', '-')}`}>{tool.state}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {importResult.summary.mcpServers && importResult.summary.mcpServers.length > 0 && (
                      <div className="summary-item">
                        <div className="summary-item-header">
                          <i className="pi pi-server" />
                          <span>{t('mcp_servers', 'MCP Servers')} ({importResult.summary.mcpServers.length})</span>
                        </div>
                        <ul className="summary-list">
                          {importResult.summary.mcpServers.map((server, idx) => (
                            <li key={idx} className="summary-list-item">
                              <span className="item-name">{server.name}</span>
                              <span className="item-detail">ID: {server.id}</span>
                              <span className={`item-state state-${server.state.toLowerCase().replace('_', '-')}`}>{server.state}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export result section */}
        {exportResult && (() => {
          // Decode base64 data
          let decodedData: any = null;
          
          try {
            const decoded = atob(exportResult.data);
            decodedData = JSON.parse(decoded);
          } catch (error) {
            console.error('Failed to decode export data:', error);
          }

          const handleDownload = () => {
            const exportData = {
              checksum: exportResult.checksum,
              data: exportResult.data
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export-${exportResult.checksum.substring(0, 8)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          };

          return (
            <div className="content-section">
              <div className="section-header">
                <i className="pi pi-upload section-icon" />
                <h3 className="section-title">{t('export_result', 'Export Result')}</h3>
                <button onClick={handleDownload} className="download-button">
                  <i className="pi pi-download" />
                  <span>{t('download', 'Download')}</span>
                </button>
              </div>
              <div className="content-box">
                {decodedData && (
                  <div className="result-summary">
                    <div className="summary-title">{t('summary', 'Summary')}</div>
                    <div className="summary-grid">
                      {decodedData.agents && decodedData.agents.length > 0 && (
                        <div className="summary-item">
                          <div className="summary-item-header">
                            <i className="pi pi-users" />
                            <span>{t('agents', 'Agents')} ({decodedData.agents.length})</span>
                          </div>
                          <ul className="summary-list">
                            {decodedData.agents.map((agent: any, idx: number) => (
                              <li key={idx} className="summary-list-item">
                                <span className="item-name">{agent.name?.en || agent.name || agent.id}</span>
                                <span className="item-detail">ID: {agent.id}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {decodedData.tools && decodedData.tools.length > 0 && (
                        <div className="summary-item">
                          <div className="summary-item-header">
                            <i className="pi pi-wrench" />
                            <span>{t('tools', 'Tools')} ({decodedData.tools.length})</span>
                          </div>
                          <ul className="summary-list">
                            {decodedData.tools.map((tool: any, idx: number) => (
                              <li key={idx} className="summary-list-item">
                                <span className="item-name">{tool.name?.en || tool.name || tool.id}</span>
                                <span className="item-detail">ID: {tool.id}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {decodedData.mcpServers && decodedData.mcpServers.length > 0 && (
                        <div className="summary-item">
                          <div className="summary-item-header">
                            <i className="pi pi-server" />
                            <span>{t('mcp_servers', 'MCP Servers')} ({decodedData.mcpServers.length})</span>
                          </div>
                          <ul className="summary-list">
                            {decodedData.mcpServers.map((server: any, idx: number) => (
                              <li key={idx} className="summary-list-item">
                                <span className="item-name">{server.name?.en || server.name || server.id}</span>
                                <span className="item-detail">ID: {server.id}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Unified logs table - show for log details and job details with related logs */}
        {hasMessages && (
          <UnifiedLogsTable 
            ref={dataTableRef}
            messages={sortedMessages}
            loading={loading}
            error={error}
            title={title}
            className="log-messages-datatable"
          />
        )}
      </div>
    </BasePage>
  );
};

export default UnifiedDetailsView;
