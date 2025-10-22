import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Timeline } from 'primereact/timeline';
import { Tag } from 'primereact/tag';
import { AppState } from '../../types/common';
import { BasePage } from '../shared/BasePage';
import { useSessionFlow } from '../../hooks/useSessionFlow';
import { getLogLevelSeverity } from '../../utils/severityHelpers';
import { LogService } from '../../services/logService';

interface SessionFlowPageProps {
  appState: AppState;
}

const SessionFlowPage: React.FC<SessionFlowPageProps> = ({ appState }) => {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [agentId, setAgentId] = useState<string | undefined>();
  const { flows, loading, error, fetchBySessionId } = useSessionFlow(appState);
  const logService = useMemo(() => new LogService(appState), [appState]);

  useEffect(() => {
    // Get agentId from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    setAgentId(agentIdParam || undefined);
  }, [location.search]);

  useEffect(() => {
    // Fetch session flow data
    if (sessionId) {
      fetchBySessionId(sessionId);
    }
  }, [fetchBySessionId, sessionId]);

  const handleBackToLogs = () => {
    // Navigate back to sessions tab with agentId if available
    const queryParams = agentId ? `?agentId=${agentId}` : '';
    navigate(`/logs/sessions${queryParams}`);
  };

  const handleFlowLogClick = async (requestId: string, messageTimestamp?: string) => {
    // Store the message timestamp for scrolling to specific message
    if (messageTimestamp) {
      sessionStorage.setItem('scrollToMessage', messageTimestamp);
    }
    
    try {
      // Navigate to log details page
      const log = await logService.getRequestLogs(requestId);
      if (log?.id) {
        navigate(`/logs/requests/${log.id}`);
      }
    } catch (error) {
      console.error('Error fetching log details:', error);
    }
  };

  const items = useMemo(() => {
    if (flows.length === 0) return [];
    
    // Merge all messages from all flows
    const allMessages = flows.flatMap(flow => flow.nodes);
    
    // Group by agentId
    const groups = new Map<string, any[]>();
    allMessages.forEach(message => {
      const key = message.agentId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(message);
    });
    
    // Assign colors to each agent (avoiding red-like colors)
    const colors = [
      '#e3f2fd', // Light blue
      '#e8f5e8', // Light green
      '#fff3e0', // Light orange
      '#f1f8e9', // Light lime
      '#e0f2f1', // Light teal
      '#fff8e1', // Light yellow
      '#f0f4ff', // Light indigo
      '#f8f9fa', // Light gray
      '#bbdefb', // Darker blue
      '#e1bee7', // Darker purple
      '#c8e6c9', // Darker green
      '#dcedc8', // Darker lime
      '#b2dfdb', // Darker teal
      '#fff59d', // Darker yellow
      '#c5cae9', // Darker indigo
    ];
    
    const groupColors = new Map<string, string>();
    let colorIndex = 0;
    groups.forEach((_, key) => {
      groupColors.set(key, colors[colorIndex % colors.length]);
      colorIndex++;
    });
    
    // Sort messages by timestamp and assign colors
    const sortedMessages = allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedMessages.map((message) => ({
      status: message.severity,
      date: new Date(message.timestamp).toLocaleString(),
      message: message.message,
      agentId: message.agentId,
      agentColor: groupColors.get(message.agentId),
      logId: message.id,
      messageTimestamp: message.timestamp,
    }));
  }, [flows]);

  return (
    <BasePage
      loading={loading}
      error={error}
      title={`${t('flow', 'Flow')} - ${sessionId}`}
      className="session-flow"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <button 
          onClick={handleBackToLogs}
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
          ← {t('back_to_sessions', 'Back to Sessions')}
        </button>
      </div>

      <div className="session-flow-tab flex flex-col items-start justify-center min-h-[60vh] p-8">
        <div className="w-full max-w-4xl">
          {loading ? (
            <div className="loading-state">
              <i className="pi pi-spin pi-spinner loading-spinner"></i>
              <div>{t('loading_logs', 'Loading logs...')}</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-calendar empty-state-icon"></i>
              <div>{t('no_logs_found', 'No logs found')}</div>
            </div>
          ) : (
            <Timeline
              value={items}
              content={(item) => (
                <div 
                  className="timeline-item"
                  style={{ 
                    background: item.agentColor || '#fff',
                    borderLeft: `4px solid ${item.agentColor ? 'rgba(0,0,0,0.1)' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    minWidth: '600px',
                    maxWidth: '1200px'
                  }}
                  onClick={() => handleFlowLogClick(item.logId, item.messageTimestamp)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="timeline-header">
                    <strong>{item.date} ({item.agentId})</strong>
                    <Tag value={item.status} severity={getLogLevelSeverity(item.status)} />
                  </div>
                  <div className="timeline-message">{item.message}</div>
                </div>
              )}
              marker={(item) => (
                <div 
                  className="timeline-marker"
                  style={{
                    backgroundColor: item.agentColor || '#e5e7eb',
                  }} 
                />
              )}
              opposite={() => null}
            />
          )}
        </div>
      </div>
    </BasePage>
  );
};

export default SessionFlowPage;
