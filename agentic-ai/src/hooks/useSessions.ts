import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { AppState } from '../types/common';
import { LogService } from '../services/logService';
import { SessionLogs } from '../types/Log';

export const useSessions = (appState: AppState) => {
  const location = useLocation();
  const [sessions, setSessions] = useState<SessionLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const logService = new LogService(appState);

  const fetchSessions = useCallback(async (agentId: string, _sortBy?: string, _sortOrder?: 'ASC' | 'DESC', newPageSize?: number, newPageNumber?: number) => {
    try {
      setLoading(true);
      setError(null);
      const currentPageSize = newPageSize || pageSize;
      const currentPageNumber = newPageNumber || pageNumber;
      
      const response = await logService.getSessions(agentId || undefined, currentPageSize, currentPageNumber);
      
      setSessions(response.data);
      setTotalRecords(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token, pageSize, pageNumber]);

  const refreshSessions = useCallback((agentId: string) => {
    return fetchSessions(agentId || '', undefined, undefined, undefined, undefined);
  }, [fetchSessions]);

  const sortSessions = useCallback((_sortBy: string, _sortOrder: 'ASC' | 'DESC', agentId: string) => {
    // For now, just refresh the sessions - sorting will be handled locally
    return fetchSessions(agentId || '', undefined, undefined, undefined, undefined);
  }, [fetchSessions]);

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  // Single useEffect to handle both initial load and pagination changes
  useEffect(() => {
    // Get current agentId from URL for filtering
    const urlParams = new URLSearchParams(location.search);
    const agentIdParam = urlParams.get('agentId');
    
    // Always fetch sessions, with or without agentId filter
    fetchSessions(agentIdParam || '', 'metadata.modifiedAt', 'DESC', pageSize, pageNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageNumber, appState.tenant, appState.token, location.search]);

  return {
    sessions,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    refreshSessions,
    sortSessions,
    changePage,
    changePageSize
  };
};
