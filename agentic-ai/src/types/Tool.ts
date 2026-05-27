import { AppState } from './common'
import { Token } from './Token'

export enum RagCustomDatabase {
  QDRANT = 'qdrant',
  INVALID = 'invalid',
}

export const PRODUCT_ENTITY_TYPE = 'product'

export enum RagLlmProvider {
  OPENAI = 'openai',
  EMPORIX_OPENAI = 'emporix_openai',
  SELF_HOSTED_OLLAMA = 'self_hosted_ollama',
}

export const RAG_FIELD_KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/

export interface RagEmporixFieldConfig {
  name?: string
  key?: string
  custom?: boolean
}

export interface RagEmporixFilterFieldConfig {
  key?: string
  name?: string
  description?: string
}

export interface RagCustomEmbeddingConfig {
  model?: string
  token?: Token
}

export interface RagCustomDatabaseConfig {
  url?: string
  type?: RagCustomDatabase
  entityType?: string
  collectionName?: string
  token?: Token
}

export interface RagEmporixEmbeddingConfig {
  provider?: RagLlmProvider
  model?: string
  dimensions?: number
  url?: string
  token?: Token
}

export interface ToolConfig {
  teamId?: string
  botToken?: string
  prompt?: string
  maxResults?: number
  databaseConfig?: RagCustomDatabaseConfig
  embeddingConfig?: RagCustomEmbeddingConfig | RagEmporixEmbeddingConfig
  entityType?: string
  indexedFields?: RagEmporixFieldConfig[]
  filterFields?: RagEmporixFilterFieldConfig[]
}

export interface Tool {
  id: string
  name: string
  type: string
  config: ToolConfig
  enabled?: boolean
}

export interface ToolCardProps {
  tool: Tool
  onToggleActive?: (toolId: string, enabled: boolean) => void | Promise<void>
  onConfigure: (tool: Tool) => void
  onRemove: (toolId: string) => void
  onReindex?: (tool: Tool) => void
}

export interface ToolConfigPanelProps {
  visible: boolean
  tool: Tool | null
  onHide: () => void
  onSave: (tool: Tool) => void
  appState: AppState
}
