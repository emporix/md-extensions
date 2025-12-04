export interface McpServer {
  type: 'predefined' | 'custom'
  domain?: string // For predefined servers
  tools?: string[] // For predefined servers
  mcpServer?: {
    // For custom servers (references MCP management)
    id: string
  }
}

export interface NativeTool {
  id: string
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
export interface LlmConfig {
  model: string
  temperature: number
  maxTokens: number
  provider: LlmProvider
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
