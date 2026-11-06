import {
  AgentTemplate,
  AgentWithVersions,
  CustomAgent,
  LocalizedString,
} from '../types/Agent'
import { AppState } from '../types/common'
import { ImportAgentsResult } from '../types/Job'
import { getLanguagesFromStorage } from '../hooks/useLanguages'
import { COMMERCE_FILTER_ASSISTANT_I18N_KEYS } from '../utils/agentFilterDslHelpers'
import { getBundleHelperTemplateIds } from '../utils/agentTemplateBundles'
import { JSON_SCHEMA_ASSISTANT_I18N_KEYS } from '../utils/jsonSchemaAssistantHelpers'
import { MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS } from '../utils/mcpToolFromFunctionAssistantHelpers'
import { LOG_ANALYSIS_ASSISTANT_I18N_KEYS } from '../utils/logAnalysisAssistantHelpers'
import { CHAT_UPLOAD_FAILED_KEY } from '../utils/chatImageUpload'
import {
  COMMERCE_FILTER_DSL_AGENT_ID,
  COMMERCE_FILTER_DSL_AGENT_TEMPLATE_ID,
  JSON_SCHEMA_ASSISTANT_AGENT_ID,
  JSON_SCHEMA_ASSISTANT_TEMPLATE_ID,
  LOG_ANALYSIS_ASSISTANT_AGENT_ID,
  LOG_ANALYSIS_ASSISTANT_TEMPLATE_ID,
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_AGENT_ID,
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_TEMPLATE_ID,
  RECOMMENDED_PROMPTS_AGENT_ID,
  RECOMMENDED_PROMPTS_AGENT_TEMPLATE_ID,
  RECOMMENDED_PROMPTS_TEMPLATE_NOT_FOUND_KEY,
} from '../constants/agentConstants'
import { ApiClient } from './apiClient'

export class BundleHelperTemplateNotFoundError extends Error {
  readonly helperTemplateId: string

  constructor(helperTemplateId: string) {
    super('BundleHelperTemplateNotFoundError')
    this.name = 'BundleHelperTemplateNotFoundError'
    this.helperTemplateId = helperTemplateId
  }
}

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

export type ChatWithAgentOptions = {
  readonly emptyResponseKey?: string
  readonly sessionId?: string
  readonly onToken?: (accumulated: string) => void
  readonly onThinking?: (content: string | null) => void
  readonly onToolActivity?: (toolName: string | null) => void
  readonly onArtifact?: (artifact: {
    readonly artifactId?: string
    readonly kind: 'image' | 'file'
    readonly filename: string
    readonly mimeType: string
    readonly size: number
    readonly status: 'ready' | 'failed' | 'pending'
    readonly errorCode?: string
    readonly generationId?: string
  }) => void
  readonly onSessionId?: (sessionId: string) => void
  readonly signal?: AbortSignal
  readonly attachments?: readonly ChatAttachmentRef[]
}

export type ChatAttachmentRef = {
  readonly attachmentId: string
  readonly purpose?: string
  readonly caption?: string
}

const chatRequestBody = (
  agentId: string,
  message: string,
  attachments?: readonly ChatAttachmentRef[]
) => ({
  agentId,
  message,
  ...(attachments && attachments.length > 0 ? { attachments } : {}),
})

export const chatWithAgent = async (
  appState: AppState,
  agentId: string,
  message: string,
  options: ChatWithAgentOptions = {}
): Promise<string> => {
  const emptyResponseKey =
    options.emptyResponseKey ??
    COMMERCE_FILTER_ASSISTANT_I18N_KEYS.emptyResponse
  const api = getApiClient(appState)
  const body = chatRequestBody(agentId, message, options.attachments)
  const requestInit: RequestInit = {}
  if (options.sessionId) {
    requestInit.headers = { 'session-id': options.sessionId }
  }
  if (options.signal) {
    requestInit.signal = options.signal
  }
  const stream = api.postSse(
    `/ai-service/${appState.tenant}/agentic/chat-stream`,
    body,
    options.sessionId || options.signal ? requestInit : undefined
  )

  let text = ''
  let sawArtifact = false
  for await (const event of stream) {
    if (event.type === 'thinking') {
      options.onThinking?.(event.content)
      continue
    }

    if (event.type === 'token') {
      text += event.content
      options.onThinking?.(null)
      options.onToken?.(text)
      continue
    }

    if (event.type === 'tool_start') {
      options.onToolActivity?.(event.toolName)
      continue
    }

    if (event.type === 'tool_end') {
      options.onToolActivity?.(null)
      continue
    }

    if (event.type === 'artifact') {
      sawArtifact = true
      options.onArtifact?.({
        artifactId: event.artifactId,
        kind: event.kind,
        filename: event.filename,
        mimeType: event.mimeType,
        size: event.size,
        status: event.status,
        errorCode: event.errorCode,
        generationId: event.generationId,
      })
      continue
    }

    if (event.type === 'error') {
      throw new Error(event.message)
    }

    if (event.type === 'done') {
      if (event.sessionId) {
        options.onSessionId?.(event.sessionId)
      }
      break
    }
  }

  const trimmed = text.trim()
  if (!trimmed && !sawArtifact) {
    throw new Error(emptyResponseKey)
  }
  return trimmed
}

const readChatEntry = (payload: unknown): Record<string, unknown> | null => {
  const entry = Array.isArray(payload) ? payload[0] : payload
  if (!entry || typeof entry !== 'object') {
    return null
  }
  return entry as Record<string, unknown>
}

const readChatMessage = (payload: unknown): string => {
  const message = readChatEntry(payload)?.message
  return typeof message === 'string' ? message.trim() : ''
}

const readChatSessionId = (payload: unknown): string | null => {
  const sessionId = readChatEntry(payload)?.sessionId
  return typeof sessionId === 'string' && sessionId.trim()
    ? sessionId.trim()
    : null
}

export const chatWithAgentOnce = async (
  appState: AppState,
  agentId: string,
  message: string,
  options: Pick<
    ChatWithAgentOptions,
    'emptyResponseKey' | 'signal' | 'sessionId' | 'onSessionId' | 'attachments'
  > = {}
): Promise<string> => {
  const api = getApiClient(appState)
  const requestInit: RequestInit = {}
  if (options.sessionId) {
    requestInit.headers = { 'session-id': options.sessionId }
  }
  if (options.signal) {
    requestInit.signal = options.signal
  }
  const payload = await api.post<unknown>(
    `/ai-service/${appState.tenant}/agentic/chat`,
    chatRequestBody(agentId, message, options.attachments),
    options.sessionId || options.signal ? requestInit : undefined
  )
  const returnedSessionId = readChatSessionId(payload)
  if (returnedSessionId) {
    options.onSessionId?.(returnedSessionId)
  }
  const text = readChatMessage(payload)
  if (!text) {
    throw new Error(
      options.emptyResponseKey ??
        COMMERCE_FILTER_ASSISTANT_I18N_KEYS.emptyResponse
    )
  }
  return text
}

const readUploadedAttachment = (
  payload: unknown
): { id: string; sessionId?: string } | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as { id?: unknown; sessionId?: unknown }
  if (typeof record.id !== 'string' || record.id.trim().length === 0) {
    return null
  }
  const sessionId =
    typeof record.sessionId === 'string' && record.sessionId.trim().length > 0
      ? record.sessionId.trim()
      : undefined
  return { id: record.id.trim(), sessionId }
}

export const uploadChatImage = async (
  appState: AppState,
  agentId: string,
  file: File,
  options: { readonly sessionId?: string; readonly signal?: AbortSignal } = {}
): Promise<{ readonly id: string; readonly sessionId?: string }> => {
  const api = getApiClient(appState)
  const body = new FormData()
  body.append('attachment', file, file.name)
  const headers: Record<string, string> = {}
  if (options.sessionId) {
    headers['session-id'] = options.sessionId
  }
  const payload = await api.postForm<unknown>(
    `/ai-service/${appState.tenant}/agentic/${agentId}/attachments`,
    body,
    { headers, signal: options.signal }
  )
  const uploaded = readUploadedAttachment(payload)
  if (!uploaded) {
    throw new Error(CHAT_UPLOAD_FAILED_KEY)
  }
  return uploaded
}

type CreateTemplateAgentParams = {
  readonly templateId: string
  readonly agentId: string
  readonly templateNotFoundKey: string
}

const createTemplateAgent = async (
  appState: AppState,
  { templateId, agentId, templateNotFoundKey }: CreateTemplateAgentParams
): Promise<{ success: boolean }> => {
  const templates = await getAgentTemplates(appState)
  const template = templates.find((item) => item.id === templateId)
  if (!template) {
    throw new Error(templateNotFoundKey)
  }
  const result = await copyTemplate(
    appState,
    templateId,
    agentId,
    { ...template.name },
    { ...template.description },
    template.userPrompt
  )
  await patchCustomAgent(appState, agentId, [
    { op: 'REPLACE', path: '/enabled', value: true },
  ])
  return result
}

export const createCommerceFilterDslAgent = async (
  appState: AppState
): Promise<{ success: boolean }> =>
  createTemplateAgent(appState, {
    templateId: COMMERCE_FILTER_DSL_AGENT_TEMPLATE_ID,
    agentId: COMMERCE_FILTER_DSL_AGENT_ID,
    templateNotFoundKey: COMMERCE_FILTER_ASSISTANT_I18N_KEYS.templateNotFound,
  })

export const createJsonSchemaAssistantAgent = async (
  appState: AppState
): Promise<{ success: boolean }> =>
  createTemplateAgent(appState, {
    templateId: JSON_SCHEMA_ASSISTANT_TEMPLATE_ID,
    agentId: JSON_SCHEMA_ASSISTANT_AGENT_ID,
    templateNotFoundKey: JSON_SCHEMA_ASSISTANT_I18N_KEYS.templateNotFound,
  })

export const createLogAnalysisAssistantAgent = async (
  appState: AppState
): Promise<{ success: boolean }> =>
  createTemplateAgent(appState, {
    templateId: LOG_ANALYSIS_ASSISTANT_TEMPLATE_ID,
    agentId: LOG_ANALYSIS_ASSISTANT_AGENT_ID,
    templateNotFoundKey: LOG_ANALYSIS_ASSISTANT_I18N_KEYS.templateNotFound,
  })

export const createMcpToolFromFunctionAssistantAgent = async (
  appState: AppState
): Promise<{ success: boolean }> =>
  createTemplateAgent(appState, {
    templateId: MCP_TOOL_FROM_FUNCTION_ASSISTANT_TEMPLATE_ID,
    agentId: MCP_TOOL_FROM_FUNCTION_ASSISTANT_AGENT_ID,
    templateNotFoundKey:
      MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS.templateNotFound,
  })

export const createRecommendedPromptsAgent = async (
  appState: AppState
): Promise<{ success: boolean }> =>
  createTemplateAgent(appState, {
    templateId: RECOMMENDED_PROMPTS_AGENT_TEMPLATE_ID,
    agentId: RECOMMENDED_PROMPTS_AGENT_ID,
    templateNotFoundKey: RECOMMENDED_PROMPTS_TEMPLATE_NOT_FOUND_KEY,
  })

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

export const getCustomAgent = async (
  appState: AppState,
  agentId: string
): Promise<CustomAgent> => {
  const api = getApiClient(appState)
  return await api.get<CustomAgent>(
    `/ai-service/${appState.tenant}/agentic/agents/${agentId}`
  )
}

export const getAgentWithVersions = async (
  appState: AppState,
  agentId: string
): Promise<AgentWithVersions> => {
  const api = getApiClient(appState)
  return await api.get<AgentWithVersions>(
    `/ai-service/${appState.tenant}/agentic/agents/${agentId}?allVersions=true`
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

export const copyTemplateWithBundle = async (
  appState: AppState,
  primaryTemplate: AgentTemplate,
  id: string,
  name: LocalizedString,
  description: LocalizedString,
  userPrompt: string
): Promise<{ success: boolean }> => {
  const helperTemplateIds = getBundleHelperTemplateIds(primaryTemplate.id)

  if (helperTemplateIds.length > 0) {
    const [templates, existingAgents] = await Promise.all([
      getAgentTemplates(appState),
      getCustomAgents(appState),
    ])
    const existingIds = new Set(existingAgents.map((agent) => agent.id))

    for (const helperTemplateId of helperTemplateIds) {
      if (existingIds.has(helperTemplateId)) {
        continue
      }

      const helperTemplate = templates.find(
        (template) => template.id === helperTemplateId
      )
      if (!helperTemplate) {
        throw new BundleHelperTemplateNotFoundError(helperTemplateId)
      }

      await copyTemplate(
        appState,
        helperTemplateId,
        helperTemplateId,
        { ...helperTemplate.name },
        { ...helperTemplate.description },
        helperTemplate.userPrompt
      )
      await patchCustomAgent(appState, helperTemplateId, [
        { op: 'REPLACE', path: '/enabled', value: true },
      ])
    }
  }

  return copyTemplate(
    appState,
    primaryTemplate.id,
    id,
    name,
    description,
    userPrompt
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
      ...(agent.llmConfig.temperature !== undefined && {
        temperature: agent.llmConfig.temperature,
      }),
      maxTokens: agent.llmConfig.maxTokens,
      provider: agent.llmConfig.provider,
      ...(agent.llmConfig.baseProvider && {
        baseProvider: agent.llmConfig.baseProvider,
      }),
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

export type EventSubscription = {
  readonly event?: {
    readonly type?: string
    readonly eventSchema?: unknown
    readonly group?: {
      readonly en?: string
    }
  }
}

export const fetchEventSubscriptions = async (
  appState: AppState,
  signal?: AbortSignal
): Promise<EventSubscription[]> => {
  const api = getApiClient(appState)
  return await api.get<EventSubscription[]>(
    `/webhook/${appState.tenant}/event-subscriptions`,
    { signal }
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
): Promise<ImportAgentsResult> => {
  const api = getApiClient(appState)
  return await api.post<ImportAgentsResult>(
    `/ai-service/${appState.tenant}/agentic/agents/import`,
    jsonBody
  )
}
