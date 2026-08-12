import { Tool } from '../types/Tool'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getTools = async (appState: AppState): Promise<Tool[]> => {
  try {
    const api = getApiClient(appState)
    return await api.get<Tool[]>(`/ai-service/${appState.tenant}/agentic/tools`)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch tools'
    throw new Error(errorMessage)
  }
}

export const getTool = async (
  appState: AppState,
  toolId: string
): Promise<Tool> => {
  const api = getApiClient(appState)
  return await api.get<Tool>(
    `/ai-service/${appState.tenant}/agentic/tools/${toolId}`
  )
}

export const updateTool = async (
  appState: AppState,
  tool: Tool
): Promise<Tool> => {
  try {
    const api = getApiClient(appState)
    return await api.put<Tool>(
      `/ai-service/${appState.tenant}/agentic/tools/${tool.id}`,
      tool
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update tool'
    throw new Error(errorMessage)
  }
}

export const patchTool = async (
  appState: AppState,
  toolId: string,
  patches: Array<{ op: string; path: string; value: unknown }>,
  force?: boolean
): Promise<Tool> => {
  try {
    const api = getApiClient(appState)
    const url = `/ai-service/${appState.tenant}/agentic/tools/${toolId}${force ? '?force=true' : ''}`
    return await api.patch<Tool>(url, patches)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to patch tool'
    throw new Error(errorMessage)
  }
}

export const deleteTool = async (
  appState: AppState,
  toolId: string,
  force?: boolean
): Promise<void> => {
  try {
    const api = getApiClient(appState)
    const url = `/ai-service/${appState.tenant}/agentic/tools/${toolId}${force ? '?force=true' : ''}`
    await api.delete(url)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete tool'
    throw new Error(errorMessage)
  }
}

export const getSlackInstallationData = async (
  appState: AppState
): Promise<{ id: string; clientId: string }> => {
  try {
    const api = getApiClient(appState)
    return await api.get<{ id: string; clientId: string }>(
      `/ai-service/${appState.tenant}/agentic/oauth/installations/slack`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch Slack installation data'
    throw new Error(errorMessage)
  }
}

export const getTeamsInstallationData = async (
  appState: AppState,
  providerTenantId?: string,
  toolId?: string,
  toolPersisted?: boolean
): Promise<{
  id: string
  appId: string | null
  appInstallUrl: string | null
  adminConsentUrl?: string | null
}> => {
  try {
    const api = getApiClient(appState)
    const queryParams = new URLSearchParams()
    if (providerTenantId?.trim()) {
      queryParams.set('providerTenantId', providerTenantId.trim())
    }
    if (toolId?.trim()) {
      queryParams.set('toolId', toolId.trim())
    }
    if (toolPersisted) {
      queryParams.set('toolPersisted', 'true')
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return await api.get<{
      id: string
      appId: string | null
      appInstallUrl: string | null
      adminConsentUrl?: string | null
    }>(
      `/ai-service/${appState.tenant}/agentic/oauth/installations/teams${query}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch Teams installation data'
    throw new Error(errorMessage)
  }
}

export type TeamsInstallationStatus = {
  status: 'pending' | 'ready' | 'missing'
  installStateId?: string | null
  providerTenantId?: string | null
  teamId?: string | null
  toolId?: string | null
}

export const getTeamsInstallationStatus = async (
  appState: AppState,
  installStateId?: string,
  providerTenantId?: string
): Promise<TeamsInstallationStatus> => {
  try {
    const api = getApiClient(appState)
    const queryParams = new URLSearchParams()
    if (installStateId?.trim()) {
      queryParams.set('installStateId', installStateId.trim())
    }
    if (providerTenantId?.trim()) {
      queryParams.set('providerTenantId', providerTenantId.trim())
    }
    const query = queryParams.toString()
    return await api.get<TeamsInstallationStatus>(
      `/ai-service/${appState.tenant}/agentic/oauth/installations/teams/status${query ? `?${query}` : ''}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch Teams installation status'
    throw new Error(errorMessage)
  }
}

export const getTokens = async (
  appState: AppState
): Promise<Array<{ id: string; name: string }>> => {
  try {
    const api = getApiClient(appState)
    return await api.get<Array<{ id: string; name: string }>>(
      `/ai-service/${appState.tenant}/agentic/tokens`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch tokens'
    throw new Error(errorMessage)
  }
}
