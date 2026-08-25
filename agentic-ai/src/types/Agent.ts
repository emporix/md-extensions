export interface McpServer {
  type: 'predefined' | 'custom' | 'dynamic'
  domain?: string
  tools?: string[]
  mcpServer?: {
    id: string
  }
}

export interface NativeTool {
  id: string
  allowedOperations?: string[]
}

export interface AgentCollaboration {
  agentId: string
  description: string
}

export interface LocalizedString {
  [key: string]: string
}

export interface AgentTemplate {
  id: string
  name: LocalizedString
  description: LocalizedString
  userPrompt: string
  templatePrompt: string
  type: string
  mcpServers: McpServer[]
  nativeTools: NativeTool[]
  enabled: boolean
  icon?: string
  tags?: string[]
}

export interface AgentCategory {
  security: string
  productivity: string
  finance: string
  complaint: string
  [key: string]: string
}

export enum LlmProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  EMPORIX_OPENAI = 'emporix_openai',
  SELF_HOSTED_OLLAMA = 'self_hosted_ollama',
  SELF_HOSTED_VLLM = 'self_hosted_vllm',
}

/** Cloud LLM API compatibility for self-hosted endpoints. */
export enum BaseProvider {
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OPENAI = 'openai',
}

const BASE_PROVIDER_VALUES = new Set<string>(Object.values(BaseProvider))

/** Normalize API `baseProvider` (case-insensitive) to the dropdown value. */
export const parseBaseProvider = (
  value: string | undefined | null
): BaseProvider | '' => {
  if (!value) {
    return ''
  }

  const normalized = value.toLowerCase()
  return BASE_PROVIDER_VALUES.has(normalized)
    ? (normalized as BaseProvider)
    : ''
}

export enum GrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
}

export interface LlmConfig {
  model: string
  temperature?: number
  maxTokens: number
  provider: LlmProvider
  /** Optional. API compatibility for self-hosted Ollama/vLLM backends. */
  baseProvider?: BaseProvider
  additionalParams: Record<string, unknown> | null
  token?: {
    id: string
  }
  selfHostedParams?: {
    url: string
    authorizationHeaderName?: string
    authorizationHeaderToken?: {
      id: string
    }
    oauth?: {
      id: string
    }
  }
}

export interface Trigger {
  type: string
  config: Record<string, unknown> | null
}

export interface Metadata {
  version: number
  createdAt: string
  modifiedAt: string
  schema: Record<string, unknown> | null
  mixins: Record<string, unknown>
}

export interface CustomAgent {
  id: string
  name: LocalizedString
  description: LocalizedString
  userPrompt: string
  templatePrompt?: string
  outputFormat?: string
  triggers: Trigger[]
  llmConfig: LlmConfig
  mcpServers: McpServer[]
  nativeTools: NativeTool[]
  agentCollaborations: AgentCollaboration[]
  maxRecursionLimit: number
  enableMemory: boolean
  enabled: boolean
  handOff?: boolean
  metadata: Metadata
  icon?: string
  tags?: string[]
  type: string
  requiredScopes?: string[]
}
