import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export type ReindexJobStatus = 'FAILURE' | 'IN_PROGRESS' | 'PENDING' | 'SUCCESS'

export interface ReindexJobMetadata {
  createdAt: string
  modifiedAt: string
}

export interface ReindexJob {
  id: string
  entityType: string
  status: ReindexJobStatus
  message?: string
  metadata?: ReindexJobMetadata
}

export interface ReindexRequest {
  entityType: string
  rag?: boolean
}

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getReindexJobs = async (
  appState: AppState,
  q?: string
): Promise<ReindexJob[]> => {
  try {
    const api = getApiClient(appState)
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    return await api.get<ReindexJob[]>(
      `/indexing/${appState.tenant}/reindex-jobs${query}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch reindex jobs'
    throw new Error(errorMessage)
  }
}

export const getReindexJob = async (
  appState: AppState,
  reindexJobId: string
): Promise<ReindexJob> => {
  try {
    const api = getApiClient(appState)
    return await api.get<ReindexJob>(
      `/indexing/${appState.tenant}/reindex-jobs/${reindexJobId}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch reindex job'
    throw new Error(errorMessage)
  }
}

export const reindex = async (
  appState: AppState,
  entityType: string,
  rag?: boolean
): Promise<ReindexJob> => {
  try {
    const api = getApiClient(appState)
    const body: ReindexRequest = { entityType, ...(rag !== undefined && { rag }) }
    return await api.post<ReindexJob>(
      `/indexing/${appState.tenant}/reindex-jobs`,
      body
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to trigger reindex'
    throw new Error(errorMessage)
  }
}
