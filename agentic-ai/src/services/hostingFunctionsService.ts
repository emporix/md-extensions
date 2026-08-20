import { ProjectCloudFunction } from '../types/Mcp'
import { AppState } from '../types/common'
import { ApiClient, ApiClientError } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => new ApiClient(appState)

export type ProjectFunctionsLoadResult = {
  functions: ProjectCloudFunction[]
  featureDisabled: boolean
}

export const getProjectFunctions = async (
  appState: AppState
): Promise<ProjectFunctionsLoadResult> => {
  const api = getApiClient(appState)

  try {
    const functions = await api.get<ProjectCloudFunction[]>(
      `/automation/${appState.tenant}/projects/functions`
    )
    return {
      functions: Array.isArray(functions) ? functions : [],
      featureDisabled: false,
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return { functions: [], featureDisabled: false }
    }
    if (error instanceof ApiClientError && error.status === 403) {
      return { functions: [], featureDisabled: true }
    }
    throw error
  }
}
