import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { JobSummary } from '../types/Job'
import { useAppState } from '../contexts/AppStateContext'
import { JobService } from '../services/jobService'
import { useCursorPagination } from './useCursorPagination'

export const useJobs = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>('metadata.createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const loadRequestIdRef = useRef(0)

  const {
    cursor,
    nextCursor,
    prevCursor,
    setCursors,
    resetCursor,
    goNext,
    goPrevious,
    cursorKey,
  } = useCursorPagination()

  const jobService = useMemo(() => new JobService(appState), [appState])

  const fetchJobs = useCallback(
    async (
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      agentId?: string,
      newFilters?: Record<string, string>
    ) => {
      const requestId = ++loadRequestIdRef.current
      const requestCursor = cursor
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentFilters = newFilters !== undefined ? newFilters : filters
        const response = await jobService.getJobs(
          currentSortBy,
          currentSortOrder,
          currentPageSize,
          agentId,
          currentFilters,
          requestCursor
        )
        if (requestId !== loadRequestIdRef.current) return
        if (requestCursor && response.data.length === 0) {
          resetCursor()
          return
        }
        setJobs(response.data)
        setCursors(response.nextCursor, response.prevCursor)
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(err instanceof Error ? err.message : t('failed_to_fetch_jobs'))
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [pageSize, filters, jobService, cursor, resetCursor, setCursors, t]
  )

  const refreshJobs = useCallback(
    (agentId?: string) => {
      return fetchJobs(sortBy, sortOrder, undefined, agentId, filters)
    },
    [fetchJobs, filters, sortBy, sortOrder]
  )

  const sortJobs = useCallback(
    (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
      resetCursor()
    },
    [resetCursor]
  )

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      if (JSON.stringify(filters) === JSON.stringify(newFilters)) {
        return
      }
      setFilters(newFilters)
      resetCursor()
    },
    [filters, resetCursor]
  )

  const changePageSize = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize)
      resetCursor()
    },
    [resetCursor]
  )

  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  const fetchJobsRef = useRef(fetchJobs)
  fetchJobsRef.current = fetchJobs

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    const parsedFilters = JSON.parse(filtersString) as Record<string, string>
    fetchJobsRef.current(
      sortBy,
      sortOrder,
      pageSize,
      agentIdParam || undefined,
      parsedFilters
    )
  }, [pageSize, cursorKey, location.search, filtersString, sortBy, sortOrder])

  return {
    jobs,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    filters,
    refreshJobs,
    sortJobs,
    changePageSize,
    updateFilters,
    goNext,
    goPrevious,
  }
}
