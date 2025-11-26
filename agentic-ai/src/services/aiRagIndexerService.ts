import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getRagMetadata = async (
  appState: AppState,
  ragEntityType: string
): Promise<string[]> => {
  try {
    const api = getApiClient(appState)
    return await api.get<string[]>(
      `/ai-rag-indexer/${appState.tenant}/${ragEntityType}/rag-metadata`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch RAG metadata'
    throw new Error(errorMessage)
  }
}

export const reindex = async (
  appState: AppState,
  ragEntityType: string
): Promise<void> => {
  try {
    const api = getApiClient(appState)
    await api.post<void>(
      `/ai-rag-indexer/${appState.tenant}/${ragEntityType}/reindex`,
      {}
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to trigger reindex'
    throw new Error(errorMessage)
  }
}
