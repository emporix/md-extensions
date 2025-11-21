import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { AppState } from '../../types/common'
import { UnifiedDetailsView } from '../shared'
import { useJobs } from '../../hooks/useJobs'
import { RequestLogs } from '../../types/Log'
import { LogService } from '../../services/logService'

interface JobDetailsPageProps {
  appState: AppState
}

const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ appState }) => {
  const { t } = useTranslation()
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [agentId, setAgentId] = useState<string | undefined>()
  const [log, setLog] = useState<RequestLogs | null>(null)
  const [lastFetchedRequestId, setLastFetchedRequestId] = useState<
    string | null
  >(null)

  const { selectedJob, detailsLoading, detailsError, fetchJobDetails } =
    useJobs(appState)

  useEffect(() => {
    // Get agentId from URL parameters
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    setAgentId(agentIdParam || undefined)
  }, [location.search])

  useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId)
    }
  }, [jobId, fetchJobDetails])

  const fetchLogsByRequestId = useCallback(
    async (requestId: string) => {
      try {
        const logService = new LogService(appState)
        const logsData = await logService.getAgentLogsByRequestId(requestId)
        setLog(logsData)
        setLastFetchedRequestId(requestId)
      } catch (err) {
        // Silent fail - errors are handled in the UI
      }
    },
    [appState]
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
    // Navigate back to jobs tab with agentId if available
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
