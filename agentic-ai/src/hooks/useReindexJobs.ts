import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import {
  getReindexJobs,
  getReindexJob,
  ReindexJobStatus,
} from '../services/indexingService'

const ACTIVE_JOBS_QUERY =
  'compoundLogicalQuery:((status:IN_PROGRESS) OR (status:PENDING))'

const POLL_INTERVAL_MS = 3000

interface UseReindexJobsOptions {
  onJobComplete?: (status: ReindexJobStatus, entityType: string) => void
}

export const useReindexJobs = (options?: UseReindexJobsOptions) => {
  const appState = useAppState()
  const [activeReindexEntityTypes, setActiveReindexEntityTypes] = useState<
    Set<string>
  >(new Set())
  const [pollingEntityTypes, setPollingEntityTypes] = useState<Set<string>>(
    new Set()
  )
  const intervalRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  )
  const onJobCompleteRef = useRef(options?.onJobComplete)

  useEffect(() => {
    onJobCompleteRef.current = options?.onJobComplete
  }, [options?.onJobComplete])

  const fetchActiveJobs = useCallback(async () => {
    try {
      const jobs = await getReindexJobs(appState, ACTIVE_JOBS_QUERY)
      const entityTypes = new Set(
        jobs.map((job) => job.entityType.toLowerCase())
      )
      setActiveReindexEntityTypes(entityTypes)
      return jobs
    } catch {
      setActiveReindexEntityTypes(new Set())
      return []
    }
  }, [appState])

  const startPollingJob = useCallback(
    (jobId: string, entityType: string) => {
      if (intervalRefs.current.has(jobId)) return

      const normalizedEntityType = entityType.toLowerCase()

      setPollingEntityTypes((prev) => new Set([...prev, normalizedEntityType]))

      const stopPolling = (status: ReindexJobStatus) => {
        const interval = intervalRefs.current.get(jobId)
        if (interval !== undefined) {
          clearInterval(interval)
          intervalRefs.current.delete(jobId)
        }
        setPollingEntityTypes((prev) => {
          const next = new Set(prev)
          next.delete(normalizedEntityType)
          return next
        })
        onJobCompleteRef.current?.(status, normalizedEntityType)
        fetchActiveJobs()
      }

      const interval = setInterval(async () => {
        try {
          const job = await getReindexJob(appState, jobId)
          if (job.status === 'SUCCESS' || job.status === 'FAILURE') {
            stopPolling(job.status)
          }
        } catch {
          stopPolling('FAILURE')
        }
      }, POLL_INTERVAL_MS)

      intervalRefs.current.set(jobId, interval)
    },
    [appState, fetchActiveJobs]
  )

  const loadAndPollActiveJobs = useCallback(async () => {
    const jobs = await fetchActiveJobs()
    jobs.forEach((job) => startPollingJob(job.id, job.entityType))
  }, [fetchActiveJobs, startPollingJob])

  useEffect(() => {
    loadAndPollActiveJobs()
  }, [loadAndPollActiveJobs])

  useEffect(() => {
    const intervals = intervalRefs.current
    return () => {
      intervals.forEach((interval) => clearInterval(interval))
    }
  }, [])

  const disabledReindexEntityTypes = useMemo(
    () => new Set([...activeReindexEntityTypes, ...pollingEntityTypes]),
    [activeReindexEntityTypes, pollingEntityTypes]
  )

  return {
    disabledReindexEntityTypes,
    startPollingJob,
  }
}
