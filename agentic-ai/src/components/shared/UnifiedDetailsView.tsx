import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BasePage } from './BasePage'
import UnifiedLogsTable from './UnifiedLogsTable'
import { InfoCard } from './InfoCard'
import { StatusBadge } from './StatusBadge'
import { ContentSection } from './ContentSection'
import { ImportResultSection } from './ImportResultSection'
import { ExportResultSection } from './ExportResultSection'
import { LogMessage } from '../../types/Log'
import { ImportResultSummary, ExportResult } from '../../types/Job'
import { formatTimestamp } from '../../utils/formatHelpers'
import { useScrollToMessage } from '../../hooks/useScrollToMessage'
import { getJobTypeDisplay } from '../../constants/logConstants'

interface UnifiedDetailsViewProps {
  title: string
  backButtonText: string
  onBack: () => void
  className?: string

  loading?: boolean
  error?: string | null

  agentId?: string
  sessionId?: string
  requestId?: string
  createdAt?: string | null
  duration?: number

  status?: string

  jobType?: 'import' | 'export' | 'agent_chat'
  importResult?: ImportResultSummary
  exportResult?: ExportResult

  message?: string
  response?: string

  messages?: LogMessage[]
  scrollToMessage?: string
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
  duration,
  status,
  jobType,
  importResult,
  exportResult,
  message,
  response,
  messages,
  scrollToMessage,
}) => {
  const { t } = useTranslation()
  const dataTableRef = useRef<React.ComponentRef<typeof UnifiedLogsTable>>(null)

  // Use the custom hook for scroll-to-message functionality
  useScrollToMessage(dataTableRef, messages, scrollToMessage, true)

  const statusBodyTemplate = (status: string) => {
    return <StatusBadge status={status} />
  }

  const hasErrorLogs =
    messages &&
    messages.some((message: LogMessage) => message.severity === 'ERROR')

  const getTitleWithStatus = () => {
    return (
      <div className="flex items-center gap-2">
        <span>{title}</span>
        <i
          className={`pi ${hasErrorLogs ? 'pi-times-circle' : 'pi-check-circle'} status-icon-lg ${hasErrorLogs ? 'status-icon-error' : 'status-icon-success'}`}
        />
      </div>
    )
  }

  const hasMessages = !!messages && messages.length > 0

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
  )

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
    )
  }

  if (error) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={titleWithBackButton}
        className={className}
      >
        <div className="error-state">{error}</div>
      </BasePage>
    )
  }

  if (!agentId && !sessionId && !requestId) {
    return (
      <BasePage
        loading={false}
        error={null}
        title={titleWithBackButton}
        className={className}
      >
        <div className="empty-state">No data available</div>
      </BasePage>
    )
  }

  const sortedMessages = messages
    ? [...messages].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : []

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
              <InfoCard
                label={t('logs_agent_id', 'Agent ID')}
                value={agentId}
              />
            )}
            {sessionId && (
              <InfoCard
                label={t('session_id', 'Session ID')}
                value={sessionId}
              />
            )}
            {requestId && (
              <InfoCard
                label={t('request_id', 'Request ID')}
                value={requestId}
              />
            )}
            {jobType && (
              <InfoCard
                label={t('job_type', 'Job Type')}
                value={getJobTypeDisplay(jobType)}
              />
            )}
            {duration !== undefined && duration !== null && (
              <InfoCard
                label={t('duration', 'Duration')}
                value={String(duration)}
              />
            )}
            {createdAt && (
              <InfoCard
                label={t('created_at', 'Created At')}
                value={formatTimestamp(createdAt)}
              />
            )}
            {status && (
              <InfoCard
                label={t('status', 'Status')}
                value={statusBodyTemplate(status)}
                isTag
              />
            )}
          </div>
        </div>

        {message && (
          <ContentSection
            icon="pi-inbox"
            title={t('message', 'Message')}
            content={message}
          />
        )}

        {response && (
          <ContentSection
            icon="pi-send"
            title={t('response', 'Response')}
            content={response}
          />
        )}

        {importResult && <ImportResultSection importResult={importResult} />}

        {exportResult && <ExportResultSection exportResult={exportResult} />}

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
  )
}

export default UnifiedDetailsView
