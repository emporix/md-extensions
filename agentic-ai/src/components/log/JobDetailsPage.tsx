import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useAppState } from '../../contexts/AppStateContext'
import UnifiedDetailsView from '../shared/UnifiedDetailsView'
import type { Job } from '../../types/Job'
import type { RequestLogs } from '../../types/Log'
import { JobService } from '../../services/jobService'
import { LogService } from '../../services/logService'
import { useCancellableLoad } from '../../hooks/useCancellableLoad'

const JobDetailsPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [agentId, setAgentId] = useState<string | undefined>()
  const [log, setLog] = useState<RequestLogs | null>(null)
  const [lastFetchedRequestId, setLastFetchedRequestId] = useState<
    string | null
  >(null)

  const jobService = useMemo(() => new JobService(appState), [appState])
  const logService = useMemo(() => new LogService(appState), [appState])
  const fallbackError = t('failed_to_fetch_job_details')

  const loadJobDetails = useCallback(() => {
    if (!jobId) {
      return Promise.reject(new Error(fallbackError))
    }
    return jobService.getJobDetails(jobId)
  }, [fallbackError, jobId, jobService])

  const {
    data: selectedJob,
    loading: detailsLoading,
    error: detailsError,
  } = useCancellableLoad<Job>({
    enabled: Boolean(jobId),
    load: loadJobDetails,
    fallbackError,
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    setAgentId(agentIdParam || undefined)
  }, [location.search])

  const fetchLogsByRequestId = useCallback(
    async (requestId: string) => {
      try {
        const logsData = await logService.getAgentLogsByRequestId(requestId)
        setLog(logsData)
        setLastFetchedRequestId(requestId)
      } catch (err) {
        console.error(err)
      }
    },
    [logService]
  )

  useEffect(() => {
    if (
      selectedJob &&
      selectedJob.requestId &&
      selectedJob.requestId !== lastFetchedRequestId
    ) {
      fetchLogsByRequestId(selectedJob.requestId)
    }
  }, [selectedJob, fetchLogsByRequestId, lastFetchedRequestId])

  const handleBackToJobs = () => {
    const queryParams = agentId ? `?agentId=${agentId}` : ''
    navigate(`/logs/jobs${queryParams}`)
  }

  return (
    <UnifiedDetailsView
      title={`${t('job_details', 'Job Details')} - ${jobId}`}
      backButtonText={t('back_to_logs', 'Back to Logs')}
      onBack={handleBackToJobs}
      className="job-details-page"
      loading={detailsLoading}
      error={detailsError}
      agentId={selectedJob?.agentId}
      sessionId={selectedJob?.sessionId}
      requestId={selectedJob?.requestId}
      createdAt={selectedJob?.metadata?.createdAt}
      duration={log?.duration}
      promptTokens={log?.promptTokens}
      completionTokens={log?.completionTokens}
      status={selectedJob?.status}
      jobType={selectedJob?.type}
      importResult={selectedJob?.importResult}
      exportResult={selectedJob?.exportResult}
      message={selectedJob?.message}
      response={selectedJob?.response}
      messages={log?.messages}
    />
  )
}

export default JobDetailsPage
