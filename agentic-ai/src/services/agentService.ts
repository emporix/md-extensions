import { AgentTemplate, CustomAgent, LocalizedString } from '../types/Agent'
import { AppState, ImportSummaryState } from '../types/common'
import { getLanguagesFromStorage } from '../hooks/useLanguages'
import { COMMERCE_FILTER_ASSISTANT_I18N_KEYS } from '../utils/agentFilterDslHelpers'
import { JSON_SCHEMA_ASSISTANT_I18N_KEYS } from '../utils/jsonSchemaAssistantHelpers'
import { ApiClient } from './apiClient'

const filterLocalizedString = (
  localizedString: LocalizedString
): LocalizedString => {
  const allowedLanguages = getLanguagesFromStorage().map((lang) =>
    lang.id.toLowerCase()
  )
  const filtered: LocalizedString = {}

  Object.entries(localizedString).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase()
    if (allowedLanguages.includes(normalizedKey)) {
      filtered[normalizedKey] = value
    }
  })

  return Object.keys(filtered).length > 0 ? filtered : {}
}

export interface PatchOperation {
  op: 'REPLACE' | 'ADD' | 'REMOVE'
  path: string
  value?: unknown
}

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const COMMERCE_FILTER_DSL_AGENT_TEMPLATE_ID =
  'commerce-filter-dsl-assistant'

export const COMMERCE_FILTER_DSL_AGENT_ID =
  'agentic-commerce-events-filters-creator-assistant'

export const JSON_SCHEMA_ASSISTANT_TEMPLATE_ID = 'json-schema-assistant'

export const JSON_SCHEMA_ASSISTANT_AGENT_ID = 'json-schema-assistant'

export interface AgenticChatResponseItem {
  agentId: string
  message: string
}

export const chatWithAgent = async (
  appState: AppState,
  agentId: string,
  message: string,
  emptyResponseKey: string = COMMERCE_FILTER_ASSISTANT_I18N_KEYS.emptyResponse
): Promise<string> => {
  const api = getApiClient(appState)
  const body = { agentId, message }
  const res = await api.post<AgenticChatResponseItem>(
    `/ai-service/${appState.tenant}/agentic/chat`,
    body
  )
  const text = res.message.trim()

  if (!text) {
    throw new Error(emptyResponseKey)
  }
  return text
}

export const createCommerceFilterDslAgent = async (
  appState: AppState
): Promise<{ success: boolean }> => {
  const templates = await getAgentTemplates(appState)
  const template = templates.find(
    (t) => t.id === COMMERCE_FILTER_DSL_AGENT_TEMPLATE_ID
  )
  if (!template) {
    throw new Error(COMMERCE_FILTER_ASSISTANT_I18N_KEYS.templateNotFound)
  }
  const result = await copyTemplate(
    appState,
    COMMERCE_FILTER_DSL_AGENT_TEMPLATE_ID,
    COMMERCE_FILTER_DSL_AGENT_ID,
    { ...template.name },
    { ...template.description },
    template.userPrompt
  )
  await patchCustomAgent(appState, COMMERCE_FILTER_DSL_AGENT_ID, [
    { op: 'REPLACE', path: '/enabled', value: true },
  ])
  return result
}

export const createJsonSchemaAssistantAgent = async (
  appState: AppState
): Promise<{ success: boolean }> => {
  const templates = await getAgentTemplates(appState)
  const template = templates.find(
    (item) => item.id === JSON_SCHEMA_ASSISTANT_TEMPLATE_ID
  )
  if (!template) {
    throw new Error(JSON_SCHEMA_ASSISTANT_I18N_KEYS.templateNotFound)
  }
  const result = await copyTemplate(
    appState,
    JSON_SCHEMA_ASSISTANT_TEMPLATE_ID,
    JSON_SCHEMA_ASSISTANT_AGENT_ID,
    { ...template.name },
    { ...template.description },
    template.userPrompt
  )
  await patchCustomAgent(appState, JSON_SCHEMA_ASSISTANT_AGENT_ID, [
    { op: 'REPLACE', path: '/enabled', value: true },
  ])
  return result
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
  name: LocalizedString,
  description: LocalizedString,
  userPrompt: string
): Promise<{ success: boolean }> => {
  const api = getApiClient(appState)
  return await api.post<{ success: boolean }>(
    `/ai-service/${appState.tenant}/agentic/templates/${templateId}/agents`,
    {
      id,
      name: filterLocalizedString(name),
      description: filterLocalizedString(description),
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
    name: agent.name,
    description: agent.description,
    userPrompt: agent.userPrompt,
    ...(agent.outputFormat && { outputFormat: agent.outputFormat }),
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
