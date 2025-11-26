import { McpServer } from '../types/Mcp'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getMcpServers = async (
  appState: AppState
): Promise<McpServer[]> => {
  try {
    const api = getApiClient(appState)
    return await api.get<McpServer[]>(
      `/ai-service/${appState.tenant}/agentic/mcp-servers`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load MCP servers'
    throw new Error(errorMessage)
  }
}

export const upsertMcpServer = async (
  appState: AppState,
  mcpServer: McpServer
): Promise<McpServer> => {
  try {
    const api = getApiClient(appState)
    const payload = {
      name: mcpServer.name,
      transport: mcpServer.transport,
      config: mcpServer.config,
      enabled: mcpServer.enabled,
    }
    return await api.put<McpServer>(
      `/ai-service/${appState.tenant}/agentic/mcp-servers/${mcpServer.id}`,
      payload
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to save MCP server'
    throw new Error(errorMessage)
  }
}

export const patchMcpServer = async (
  appState: AppState,
  mcpServerId: string,
  patches: Array<{ op: string; path: string; value: unknown }>,
  force?: boolean
): Promise<McpServer> => {
  try {
    const api = getApiClient(appState)
    const url = `/ai-service/${appState.tenant}/agentic/mcp-servers/${mcpServerId}${force ? '?force=true' : ''}`
    return await api.patch<McpServer>(url, patches)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to patch MCP server'
    throw new Error(errorMessage)
  }
}

export const deleteMcpServer = async (
  appState: AppState,
  mcpServerId: string,
  force?: boolean
): Promise<void> => {
  try {
    const api = getApiClient(appState)
    const url = `/ai-service/${appState.tenant}/agentic/mcp-servers/${mcpServerId}${force ? '?force=true' : ''}`
    await api.delete(url)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete MCP server'
    throw new Error(errorMessage)
  }
}
