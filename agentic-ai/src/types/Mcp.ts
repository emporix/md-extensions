import { AppState } from './common'

export interface McpConfig {
  url: string
  authorizationHeaderName?: string
  authorizationHeaderTokenId?: string
}

export interface McpServer {
  id: string
  name: string
  transport: string
  config: McpConfig
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
  onSave: (mcpServer: McpServer) => void
  appState?: AppState
}
