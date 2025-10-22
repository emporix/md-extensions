import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseCard  from '../shared/BaseCard';
import { LogSummary } from '../../types/Log';
import { formatTimestamp } from '../../utils/formatHelpers';

interface LogCardProps {
  log: LogSummary;
  onClick: (log: LogSummary) => void;
}

const LogCard: React.FC<LogCardProps> = ({ log, onClick }) => {
  const { t } = useTranslation();

  const getSeverityIcon = () => {
    if (log.errorCount > 0) {
      return <i className="pi pi-exclamation-triangle status-icon-error" />;
    }
    return <i className="pi pi-info-circle status-icon-success" />;
  };

  const getSeverityBadgeText = () => {
    if (log.errorCount > 0) {
      return `${log.errorCount} ${t('errors', 'errors')}`;
    }
    return t('success', 'Success');
  };

  const getDescription = () => {
    const parts = [];
    parts.push(`${log.messageCount} ${t('messages', 'messages')}`);
    
    if (log.duration) {
      parts.push(`${t('duration', 'Duration')}: ${log.duration}`);
    }
    
    return parts.join(' • ');
  };

  return (
    <div data-has-errors={log.errorCount > 0}>
      <BaseCard
        className="log-card"
        icon={getSeverityIcon()}
        badge={getSeverityBadgeText()}
        title={`${t('agent', 'Agent')}: ${log.agentId}`}
        description={getDescription()}
        onClick={() => onClick(log)}
      >
      <div className="log-metadata">
        <div className="log-meta-item">
          <span className="log-meta-label">{t('session_id', 'Session ID')}:</span>
          <span className="log-meta-value">{log.sessionId.substring(0, 8)}...</span>
        </div>
        <div className="log-meta-item">
          <span className="log-meta-label">{t('last_activity', 'Last Activity')}:</span>
          <span className="log-meta-value">{formatTimestamp(log.lastActivity)}</span>
        </div>
      </div>
      </BaseCard>
    </div>
  );
};

export default LogCard;
