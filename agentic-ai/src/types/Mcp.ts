import { AppState } from './common'

export interface McpTokenRef {
  id: string
}

export interface McpConfig {
  url: string
  authorizationHeaderName?: string
  authorizationHeaderToken?: McpTokenRef
}

export interface McpUpsertConfig {
  url: string
  authorizationHeaderName?: string
  authorizationHeaderToken?: string
}

export enum CustomMcpServerTransportType {
  SSE = 'sse',
  STREAMABLE_HTTP = 'streamable_http',
}

export interface McpServer {
  id: string
  name: string
  transport: CustomMcpServerTransportType
  config: McpConfig
  enabled?: boolean
}

export interface McpServerUpsert {
  id: string
  name: string
  transport: CustomMcpServerTransportType
  config: McpUpsertConfig
  enabled?: boolean
}

export interface McpCardProps {
  mcpServer: McpServer
  onToggleActive?: (
    mcpServerId: string,
    enabled: boolean
  ) => void | Promise<void>
  onConfigure: (mcpServer: McpServer) => void
  onRemove: (mcpServerId: string) => void
}

export interface McpConfigPanelProps {
  visible: boolean
  mcpServer: McpServer | null
  onHide: () => void
  onSave: (mcpServer: McpServerUpsert) => void
  appState?: AppState
}
