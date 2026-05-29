import { ProviderModelsResponse } from '../types/Model'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const fetchLlmModels = async (
  appState: AppState
): Promise<ProviderModelsResponse[]> => {
  try {
    const api = getApiClient(appState)
    return await api.get<ProviderModelsResponse[]>(
      `/ai-service/${appState.tenant}/agentic/models`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch models'
    throw new Error(errorMessage)
  }
}
