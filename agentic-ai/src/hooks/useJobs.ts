import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { JobSummary, Job } from '../types/Job';
import { AppState } from '../types/common';
import { JobService } from '../services/jobService';

export const useJobs = (appState: AppState) => {
  const location = useLocation();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const jobService = new JobService(appState);

  const fetchJobs = useCallback(async (sortBy?: string, sortOrder?: 'ASC' | 'DESC', newPageSize?: number, newPageNumber?: number, agentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const currentPageSize = newPageSize || pageSize;
      const currentPageNumber = newPageNumber || pageNumber;
      const response = await jobService.getJobs(sortBy, sortOrder, currentPageSize, currentPageNumber, agentId);
      setJobs(response.data);
      setTotalRecords(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token, pageSize, pageNumber]);

  const fetchJobDetails = useCallback(async (jobId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const jobDetails = await jobService.getJobDetails(jobId);
      setSelectedJob(jobDetails);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to fetch job details');
    } finally {
      setDetailsLoading(false);
    }
  }, [appState.tenant, appState.token]);

  const clearSelectedJob = useCallback(() => {
    setSelectedJob(null);
    setDetailsError(null);
  }, []);

  const refreshJobs = useCallback((agentId?: string) => {
    return fetchJobs('metadata.createdAt', 'DESC', undefined, undefined, agentId);
  }, [fetchJobs]);

  const sortJobs = useCallback((sortBy: string, sortOrder: 'ASC' | 'DESC', agentId?: string) => {
    return fetchJobs(sortBy, sortOrder, undefined, undefined, agentId);
  }, [fetchJobs]);

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber);
    // The fetchJobs will be called by useEffect when pageNumber changes
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
    // The fetchJobs will be called by useEffect when pageSize changes
  }, []);

  // Single useEffect to handle both initial load and pagination changes
  useEffect(() => {
    // Get current agentId from URL for filtering
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    fetchJobs('metadata.createdAt', 'DESC', pageSize, pageNumber, agentIdParam || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageNumber, appState.tenant, appState.token, location.search]);

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
    fetchJobDetails,
    clearSelectedJob,
    refreshJobs,
    sortJobs,
    changePage,
    changePageSize
  };
};
