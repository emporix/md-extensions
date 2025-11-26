import { AppState } from './common'
import { Token } from './Token'

export enum RagCustomDatabase {
  QDRANT = 'qdrant',
  INVALID = 'invalid',
}

export enum RagEntityType {
  PRODUCT = 'product',
  INVALID = 'invalid',
}

export interface RagEmporixFieldConfig {
  name?: string
  key?: string
}

export interface RagCustomEmbeddingConfig {
  model?: string
  token?: Token
}

export interface RagCustomDatabaseConfig {
  url?: string
  type?: RagCustomDatabase
  entityType?: RagEntityType
  collectionName?: string
  token?: Token
}

export interface RagEmporixNativeToolConfig {
  prompt?: string
  entityType?: RagEntityType
  indexedFields?: RagEmporixFieldConfig[]
}

export interface ToolConfig {
  teamId?: string
  botToken?: string
  prompt?: string
  maxResults?: number
  databaseConfig?: RagCustomDatabaseConfig
  embeddingConfig?: RagCustomEmbeddingConfig
  emporixNativeToolConfig?: RagEmporixNativeToolConfig
  entityType?: RagEntityType
  indexedFields?: RagEmporixFieldConfig[]
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
  isRagFeatureEnabled?: boolean
}
