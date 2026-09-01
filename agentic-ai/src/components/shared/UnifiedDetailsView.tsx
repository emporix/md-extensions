import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BasePage } from './BasePage'
import UnifiedLogsTable from './UnifiedLogsTable'
import { InfoCard } from './InfoCard'
import { StatusBadge } from './StatusBadge'
import { CommunicationSection } from './CommunicationSection'
import { ImportResultSection } from './ImportResultSection'
import { ExportResultSection } from './ExportResultSection'
import { LogMessage } from '../../types/Log'
import { ImportResultSummary, ExportResult } from '../../types/Job'
import { formatTimestamp, normalizeDuration } from '../../utils/formatHelpers'
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

  const hasInfoCards =
    Boolean(agentId) ||
    Boolean(sessionId) ||
    Boolean(requestId) ||
    Boolean(jobType) ||
    (duration !== undefined && duration !== null) ||
    Boolean(createdAt) ||
    Boolean(status)

  const infoSectionTitle = jobType ? t('job_details') : t('log_details')
  const sessionDetailsPath = sessionId
    ? `/logs/sessions/${sessionId}${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ''}`
    : undefined
  const agentDetailsPath = agentId
    ? `/agents/${encodeURIComponent(agentId)}/edit`
    : undefined

  const infoFields: React.ReactNode[] = []

  if (agentId && agentDetailsPath) {
    infoFields.push(
      <InfoCard
        key="agent"
        label={t('logs_agent_id')}
        value={
          <Link to={agentDetailsPath} className="info-value-link">
            {agentId}
          </Link>
        }
      />
    )
  }

  if (sessionId && sessionDetailsPath) {
    infoFields.push(
      <InfoCard
        key="session"
        label={t('session_id')}
        value={
          <Link to={sessionDetailsPath} className="info-value-link">
            {sessionId}
          </Link>
        }
      />
    )
  }

  if (requestId) {
    infoFields.push(
      <InfoCard key="request" label={t('request_id')} value={requestId} />
    )
  }

  if (jobType) {
    infoFields.push(
      <InfoCard
        key="jobType"
        label={t('job_type')}
        value={getJobTypeDisplay(jobType)}
      />
    )
  }

  if (duration !== undefined && duration !== null) {
    infoFields.push(
      <InfoCard
        key="duration"
        label={t('duration')}
        value={t('duration_seconds', { count: normalizeDuration(duration) })}
      />
    )
  }

  if (createdAt) {
    infoFields.push(
      <InfoCard
        key="createdAt"
        label={t('created_at')}
        value={formatTimestamp(createdAt)}
      />
    )
  }

  if (status) {
    infoFields.push(
      <InfoCard
        key="status"
        label={t('status')}
        value={statusBodyTemplate(status)}
        isTag
      />
    )
  }

  const infoFieldColumns = infoFields.flatMap((field, index) =>
    index === 0
      ? [field]
      : [
          <div
            key={`details-info-divider-${index}`}
            className="details-info-divider"
            aria-hidden="true"
          />,
          field,
        ]
  )

  return (
    <BasePage
      loading={false}
      error={null}
      title={titleWithBackButton}
      className={className}
    >
      <div className="details-content">
        {hasInfoCards && (
          <section className="details-info-section">
            <h3 className="panel-section-title">{infoSectionTitle}</h3>
            <div className="details-info-panel panel-surface">
              <div className="details-info-columns">{infoFieldColumns}</div>
            </div>
          </section>
        )}

        {(message || response) && (
          <CommunicationSection message={message} response={response} />
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
            messageMaxLines={1}
            expandMessageTimestamp={scrollToMessage}
          />
        )}
      </div>
    </BasePage>
  )
}

export default UnifiedDetailsView
