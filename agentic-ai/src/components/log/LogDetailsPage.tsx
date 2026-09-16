import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import UnifiedDetailsView from '../shared/UnifiedDetailsView'
import { useAppState } from '../../contexts/AppStateContext'
import { LogService } from '../../services/logService'
import type { RequestLogs } from '../../types/Log'
import {
  extractInitialMessageFromLog,
  extractResponseFromLog,
} from '../../utils/logHelpers'
import { useCancellableLoad } from '../../hooks/useCancellableLoad'

const LogDetailsPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { logId } = useParams<{ logId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [agentId, setAgentId] = useState<string | undefined>()

  const logService = useMemo(() => new LogService(appState), [appState])
  const fallbackError = t('failed_to_fetch_log_details')

  const loadLogDetails = useCallback(() => {
    if (!logId) {
      return Promise.reject(new Error(fallbackError))
    }
    return logService.getAgentLogDetails(logId)
  }, [fallbackError, logId, logService])

  const {
    data: selectedLog,
    loading: detailsLoading,
    error: detailsError,
  } = useCancellableLoad<RequestLogs>({
    enabled: Boolean(logId),
    load: loadLogDetails,
    fallbackError,
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    setAgentId(agentIdParam || undefined)
  }, [location.search])

  const handleBackToLogs = () => {
    const queryParams = agentId ? `?agentId=${agentId}` : ''
    navigate(`/logs/requests${queryParams}`)
  }

  const scrollToMessage = sessionStorage.getItem('scrollToMessage')

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
      promptTokens={selectedLog?.promptTokens}
      completionTokens={selectedLog?.completionTokens}
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
