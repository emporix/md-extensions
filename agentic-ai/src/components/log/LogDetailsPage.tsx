import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { AppState } from '../../types/common'
import UnifiedDetailsView from '../shared/UnifiedDetailsView'
import { useAgentLogs } from '../../hooks/useAgentLogs'
import {
  extractInitialMessageFromLog,
  extractResponseFromLog,
} from '../../utils/logHelpers'

interface LogDetailsPageProps {
  appState: AppState
}

const LogDetailsPage: React.FC<LogDetailsPageProps> = ({ appState }) => {
  const { t } = useTranslation()
  const { logId } = useParams<{ logId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [agentId, setAgentId] = useState<string | undefined>()

  const { selectedLog, detailsLoading, detailsError, fetchLogDetails } =
    useAgentLogs(appState)

  useEffect(() => {
    // Get agentId from URL parameters
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    setAgentId(agentIdParam || undefined)
  }, [location.search])

  useEffect(() => {
    if (logId) {
      fetchLogDetails(logId)
    }
  }, [logId, fetchLogDetails])

  const handleBackToLogs = () => {
    // Navigate back to requests tab with agentId if available
    const queryParams = agentId ? `?agentId=${agentId}` : ''
    navigate(`/logs/requests${queryParams}`)
  }

  // Get scrollToMessage from session storage
  const scrollToMessage = sessionStorage.getItem('scrollToMessage')

  // Extract message and response from log messages
  const extractedMessage = extractInitialMessageFromLog(selectedLog?.messages)
  const extractedResponse = extractResponseFromLog(selectedLog?.messages)

  return (
    <UnifiedDetailsView
      title={`${t('log_details', 'Log Details')} - ${logId}`}
      backButtonText={t('back_to_logs', 'Back to Logs')}
      onBack={handleBackToLogs}
      className="log-details-page"
      loading={detailsLoading}
      error={detailsError}
      agentId={selectedLog?.triggerAgentId}
      sessionId={selectedLog?.sessionId}
      requestId={selectedLog?.requestId}
      message={extractedMessage}
      response={extractedResponse}
      messages={selectedLog?.messages}
      duration={selectedLog?.duration}
      createdAt={
        selectedLog?.metadata?.createdAt
          ? String(selectedLog.metadata.createdAt)
          : null
      }
      scrollToMessage={scrollToMessage || undefined}
    />
  )
}

export default LogDetailsPage
