import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'primereact/tag';
import { BasePage, UnifiedLogsTable } from './index';
import { LogMessage } from '../../types/Log';
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
  commerceEvent?: string;
  createdAt?: string | null;
  
  // Status props
  status?: string;
  
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
  commerceEvent,
  createdAt,
  status,
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

  if (loading) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={getTitleWithStatus()}
        className={className}
      >
        <div className="flex justify-start section-spacing-sm">
          <button 
            onClick={onBack}
            className="back-button"
          >
            ← {backButtonText}
          </button>
        </div>
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
        title={getTitleWithStatus()}
        className={className}
      >
        <div className="flex justify-start section-spacing-sm">
          <button 
            onClick={onBack}
            className="back-button"
          >
            ← {backButtonText}
          </button>
        </div>
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
        title={getTitleWithStatus()}
        className={className}
      >
        <div className="flex justify-start section-spacing-sm">
          <button 
            onClick={onBack}
            className="back-button"
          >
            ← {backButtonText}
          </button>
        </div>
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
      title={getTitleWithStatus()   }
      className={className}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <button 
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#374151'
          }}
        >
          ← {backButtonText}
        </button>
      </div>
      
      <div className="details-content">
        <div className="details-header">
          <div className="details-info">
            {agentId && (
              <div className="info-item">
                <strong>{t('logs_agent_id', 'Agent ID')}:</strong> {agentId}
              </div>
            )}
            {sessionId && (
              <div className="info-item">
                <strong>{t('session_id', 'Session ID')}:</strong> {sessionId}
              </div>
            )}
            {requestId && (
              <div className="info-item">
                <strong>{t('request_id', 'Request ID')}:</strong> {requestId}
              </div>
            )}
            {commerceEvent && (
              <div className="info-item">
                <strong>{t('commerce_event', 'Commerce Event')}:</strong> {commerceEvent}
              </div>
            )}

            {(
              <>
                <div className="info-item">
                  <strong>{t('total_messages', 'Total Messages')}:</strong> {messages?.length || 0}
                </div>
                {(
                  <div className="info-item">
                    <strong>{t('duration', 'Duration')}:</strong> {calculateDuration(messages || [])}
                  </div>
                )}
              </>
            )}
            {createdAt && (
              <div className="info-item">
                <strong>{t('created_at', 'Created At')}:</strong> {formatTimestamp(createdAt)}
              </div>
            )}
            {status && (
              <div className="info-item">
                <strong>{t('status', 'Status')}:</strong> {statusBodyTemplate(status)}
              </div>
            )}
          </div>
        </div>

        {/* Optional message and response sections for jobs */}
        {(message || response) && (
          <div className="job-messages-section" style={{ marginBottom: '1.5rem' }}>
            {message && (
              <div className="job-info-item" style={{ marginBottom: '1rem' }}>
                <strong>{t('message', 'Message')}:</strong> 
                <div className="job-message-content" style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <pre className="job-message-text" style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{message}</pre>
                </div>
              </div>
            )}
            {response && (
              <div className="job-info-item">
                <strong>{t('response', 'Response')}:</strong> 
                <div className="job-message-content" style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <pre className="job-message-text" style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{response}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unified logs table for both log and job details */}
        <UnifiedLogsTable 
          ref={dataTableRef}
          messages={hasMessages ? sortedMessages : undefined}
          loading={loading}
          error={error}
          title={title}
          className="log-messages-datatable"
        />
      </div>
    </BasePage>
  );
};

export default UnifiedDetailsView;
