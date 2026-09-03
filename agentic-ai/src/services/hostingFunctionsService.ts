import { ProjectCloudFunction } from '../types/Mcp'
import { FunctionDeploymentsResponse } from '../types/FunctionDeployment'
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

export const getFunctionDeployments = async (
  appState: AppState,
  functionId: string
): Promise<FunctionDeploymentsResponse> => {
  const api = getApiClient(appState)
  return api.get<FunctionDeploymentsResponse>(
    `/automation/${appState.tenant}/projects/functions/${encodeURIComponent(functionId)}/deployments`
  )
}

export const downloadMediaAssetZip = async (
  appState: AppState,
  mediaId: string
): Promise<ArrayBuffer> => {
  const api = getApiClient(appState)
  return api.getArrayBuffer(
    `/media/${appState.tenant}/assets/${encodeURIComponent(mediaId)}/download`
  )
}
