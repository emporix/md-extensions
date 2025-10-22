import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { LogSummary, RequestLogs } from '../types/Log';
import { AppState } from '../types/common';
import { LogService } from '../services/logService';

export const useAgentLogs = (appState: AppState) => {
  const location = useLocation();
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<RequestLogs | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const logService = new LogService(appState);

  const fetchLogs = useCallback(async (sortBy?: string, sortOrder?: 'ASC' | 'DESC', newPageSize?: number, newPageNumber?: number, agentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const currentPageSize = newPageSize || pageSize;
      const currentPageNumber = newPageNumber || pageNumber;
      const response = await logService.getAgentLogs(sortBy, sortOrder, currentPageSize, currentPageNumber, agentId);
      setLogs(response.data);
      setTotalRecords(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token, pageSize, pageNumber]);

  const fetchLogDetails = useCallback(async (logId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const logDetails = await logService.getAgentLogDetails(logId);
      setSelectedLog(logDetails);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to fetch log details');
    } finally {
      setDetailsLoading(false);
    }
  }, [appState.tenant, appState.token]);

  const fetchLogsByAgent = useCallback(async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await logService.getAgentLogsByAgentId(agentId);
      setLogs(response.data);
      setTotalRecords(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs for agent');
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token]);

  const clearSelectedLog = useCallback(() => {
    setSelectedLog(null);
    setDetailsError(null);
  }, []);

  const refreshLogs = useCallback((agentId?: string) => {
    return fetchLogs('metadata.createdAt', 'DESC', undefined, undefined, agentId);
  }, [fetchLogs]);

  const sortLogs = useCallback((sortBy: string, sortOrder: 'ASC' | 'DESC', agentId?: string) => {
    return fetchLogs(sortBy, sortOrder, undefined, undefined, agentId);
  }, [fetchLogs]);

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber);
    // The fetchLogs will be called by useEffect when pageNumber changes
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
    // The fetchLogs will be called by useEffect when pageSize changes
  }, []);

  // Single useEffect to handle both initial load and pagination changes
  useEffect(() => {
    // Get current agentId from URL for filtering
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    fetchLogs('metadata.createdAt', 'DESC', pageSize, pageNumber, agentIdParam || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageNumber, appState.tenant, appState.token, location.search]);

  return {
    logs,
    loading,
    error,
    selectedLog,
    detailsLoading,
    detailsError,
    pageSize,
    pageNumber,
    totalRecords,
    fetchLogDetails,
    fetchLogsByAgent,
    clearSelectedLog,
    refreshLogs,
    sortLogs,
    changePage,
    changePageSize
  };
};
