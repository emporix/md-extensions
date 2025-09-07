export interface McpServer {
  type: 'predefined' | 'custom'
  domain?: string    // For predefined servers
  tools?: string[]   // For predefined servers
  mcpServer?: {      // For custom servers (references MCP management)
    id: string
  }
}

export interface NativeTool {
  id: string;
}

export interface AgentCollaboration {
  agentId: string;
  description: string;
}

export interface LocalizedString {
  en: string
  [key: string]: string
}

export interface AgentTemplate {
  id: string
  name: LocalizedString
  description: LocalizedString
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

export interface LlmConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  provider: string;
  additionalParams: Record<string, unknown> | null;
  token?: {
    id: string;
  };
  selfHostedParams?: {
    url: string;
    authorizationHeaderName?: string;
    authorizationHeaderToken?: {
      id: string;
    };
  };
}

export interface Trigger {
  type: string;
  config: Record<string, unknown> | null;
}

export interface Metadata {
  version: number;
  createdAt: string;
  modifiedAt: string;
  schema: Record<string, unknown> | null;
  mixins: Record<string, unknown>;
}

export interface CustomAgent {
  id: string
  name: LocalizedString | string
  description: LocalizedString | string
  userPrompt: string
  trigger: Trigger
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
} 