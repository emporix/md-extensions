import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const isRagFeatureEnabled = async (
  appState: AppState
): Promise<boolean> => {
  try {
    const api = getApiClient(appState)
    const response = await api.get<FeatureToggleDto>(
      `/feature-toggle/${appState.tenant}/features/rag`
    )
    return response.isEnabled
  } catch (error) {
    console.error('Failed to fetch RAG feature toggle:', error)
    return false
  }
}
