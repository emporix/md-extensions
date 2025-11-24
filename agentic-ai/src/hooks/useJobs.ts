import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router'
import { JobSummary, Job } from '../types/Job'
import { AppState } from '../types/common'
import { JobService } from '../services/jobService'

export const useJobs = (appState: AppState) => {
  const location = useLocation()
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const jobService = useMemo(() => new JobService(appState), [appState])

  const fetchJobs = useCallback(
    async (
      sortBy?: string,
      sortOrder?: 'ASC' | 'DESC',
      newPageSize?: number,
      newPageNumber?: number,
      agentId?: string,
      newFilters?: Record<string, string>
    ) => {
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentPageNumber = newPageNumber || pageNumber
        const currentFilters = newFilters !== undefined ? newFilters : filters
        const response = await jobService.getJobs(
          sortBy,
          sortOrder,
          currentPageSize,
          currentPageNumber,
          agentId,
          currentFilters
        )
        setJobs(response.data)
        setTotalRecords(response.totalCount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, pageNumber, filters, jobService]
  )

  const fetchJobDetails = useCallback(
    async (jobId: string) => {
      try {
        setDetailsLoading(true)
        setDetailsError(null)
        const jobDetails = await jobService.getJobDetails(jobId)
        setSelectedJob(jobDetails)
      } catch (err) {
        setDetailsError(
          err instanceof Error ? err.message : 'Failed to fetch job details'
        )
      } finally {
        setDetailsLoading(false)
      }
    },
    [jobService]
  )

  const clearSelectedJob = useCallback(() => {
    setSelectedJob(null)
    setDetailsError(null)
  }, [])

  const refreshJobs = useCallback(
    (agentId?: string) => {
      return fetchJobs(
        'metadata.createdAt',
        'DESC',
        undefined,
        undefined,
        agentId,
        filters
      )
    },
    [fetchJobs, filters]
  )

  const sortJobs = useCallback(
    (sortBy: string, sortOrder: 'ASC' | 'DESC', agentId?: string) => {
      return fetchJobs(
        sortBy,
        sortOrder,
        undefined,
        undefined,
        agentId,
        filters
      )
    },
    [fetchJobs, filters]
  )

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPageNumber(1) // Reset to first page when filters change
  }, [])

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber)
    // The fetchJobs will be called by useEffect when pageNumber changes
  }, [])

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
    // The fetchJobs will be called by useEffect when pageSize changes
  }, [])

  // Create stable reference for filters to prevent unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  // Fetch jobs when dependencies change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    fetchJobs(
      'metadata.createdAt',
      'DESC',
      pageSize,
      pageNumber,
      agentIdParam || undefined,
      filters
    )
  }, [pageSize, pageNumber, location.search, filtersString, fetchJobs, filters])

  return {
    jobs,
    loading,
    error,
    selectedJob,
    detailsLoading,
    detailsError,
    pageSize,
    pageNumber,
    totalRecords,
    filters,
    fetchJobDetails,
    clearSelectedJob,
    refreshJobs,
    sortJobs,
    changePage,
    changePageSize,
    updateFilters,
  }
}
