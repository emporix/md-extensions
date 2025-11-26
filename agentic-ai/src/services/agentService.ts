import { AgentTemplate, CustomAgent } from '../types/Agent'
import { AppState, ImportSummaryState } from '../types/common'
import { ApiClient } from './apiClient'

export interface PatchOperation {
  op: 'REPLACE' | 'ADD' | 'REMOVE'
  path: string
  value?: unknown
}

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getAgentTemplates = async (
  appState: AppState
): Promise<AgentTemplate[]> => {
  const api = getApiClient(appState)
  return await api.get<AgentTemplate[]>(
    `/ai-service/${appState.tenant}/agentic/templates`
  )
}

export const getCustomAgents = async (
  appState: AppState
): Promise<CustomAgent[]> => {
  const api = getApiClient(appState)
  return await api.get<CustomAgent[]>(
    `/ai-service/${appState.tenant}/agentic/agents`
  )
}

export const copyTemplate = async (
  appState: AppState,
  templateId: string,
  id: string,
  name: string,
  description: string,
  userPrompt: string
): Promise<{ success: boolean }> => {
  const api = getApiClient(appState)
  return await api.post<{ success: boolean }>(
    `/ai-service/${appState.tenant}/agentic/templates/${templateId}/agents`,
    {
      id,
      name: { en: name },
      description: { en: description },
      userPrompt: userPrompt,
    }
  )
}

export const upsertCustomAgent = async (
  appState: AppState,
  agent: CustomAgent
): Promise<CustomAgent> => {
  const api = getApiClient(appState)
  const formattedAgent = {
    id: agent.id,
    name: typeof agent.name === 'string' ? { en: agent.name } : agent.name,
    description:
      typeof agent.description === 'string'
        ? { en: agent.description }
        : agent.description,
    userPrompt: agent.userPrompt,
    triggers: agent.triggers,
    llmConfig: {
      model: agent.llmConfig.model,
      temperature: agent.llmConfig.temperature,
      maxTokens: agent.llmConfig.maxTokens,
      provider: agent.llmConfig.provider,
      additionalParams: agent.llmConfig.additionalParams,
      ...(agent.llmConfig.token && { token: agent.llmConfig.token }),
      ...(agent.llmConfig.selfHostedParams && {
        selfHostedParams: agent.llmConfig.selfHostedParams,
      }),
    },
    mcpServers: agent.mcpServers,
    nativeTools: agent.nativeTools,
    agentCollaborations: agent.agentCollaborations || [],
    maxRecursionLimit: agent.maxRecursionLimit,
    enableMemory: agent.enableMemory,
    enabled: agent.enabled,
    metadata: agent.metadata,
    icon: agent.icon || '',
    tags: agent.tags || [],
    requiredScopes: agent.requiredScopes || [],
  }

  return await api.put<CustomAgent>(
    `/ai-service/${appState.tenant}/agentic/agents/${agent.id}`,
    formattedAgent
  )
}

export const deleteCustomAgent = async (
  appState: AppState,
  agentId: string,
  force?: boolean
): Promise<void> => {
  const api = getApiClient(appState)
  const url = `/ai-service/${appState.tenant}/agentic/agents/${agentId}${force ? '?force=true' : ''}`
  await api.delete(url)
}

export const patchCustomAgent = async (
  appState: AppState,
  agentId: string,
  patches: PatchOperation[]
): Promise<void> => {
  const api = getApiClient(appState)
  await api.patch(
    `/ai-service/${appState.tenant}/agentic/agents/${agentId}`,
    patches
  )
}

export const getCommerceEvents = async (
  appState: AppState
): Promise<{ events: string[] }> => {
  const api = getApiClient(appState)
  return await api.get<{ events: string[] }>(
    `/ai-service/${appState.tenant}/agentic/commerce-events`
  )
}

export const exportAgents = async (
  appState: AppState,
  agentIds: string[]
): Promise<{ exportedAt: string; data: string; checksum: string }> => {
  const api = getApiClient(appState)
  return await api.post<{
    exportedAt: string
    data: string
    checksum: string
  }>(`/ai-service/${appState.tenant}/agentic/agents/export`, { agentIds })
}

export const importAgents = async (
  appState: AppState,
  jsonBody: unknown
): Promise<{
  importedAt: string
  summary: {
    agents: Array<{ id: string; name: string; state: ImportSummaryState }>
    tools: Array<{ id: string; name: string; state: ImportSummaryState }>
    mcpServers: Array<{ id: string; name: string; state: ImportSummaryState }>
  }
  message: string
}> => {
  const api = getApiClient(appState)
  return await api.post<{
    importedAt: string
    summary: {
      agents: Array<{ id: string; name: string; state: ImportSummaryState }>
      tools: Array<{ id: string; name: string; state: ImportSummaryState }>
      mcpServers: Array<{
        id: string
        name: string
        state: ImportSummaryState
      }>
    }
    message: string
  }>(`/ai-service/${appState.tenant}/agentic/agents/import`, jsonBody)
}
