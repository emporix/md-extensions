import { AppState } from './common'

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
  tokenId?: string
}

export interface RagCustomDatabaseConfig {
  url?: string
  type?: RagCustomDatabase
  entityType?: RagEntityType
  collectionName?: string
  tokenId?: string
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
}

export interface ToolConfigPanelProps {
  visible: boolean
  tool: Tool | null
  onHide: () => void
  onSave: (tool: Tool) => void
  appState: AppState
}
