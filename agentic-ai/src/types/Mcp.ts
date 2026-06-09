export interface McpTokenRef {
  id: string
}

export interface McpConfig {
  url: string
  authorizationHeaderName?: string
  authorizationHeaderToken?: McpTokenRef
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

export interface McpCardProps {
  mcpServer: McpServer
  onToggleActive?: (
    mcpServerId: string,
    enabled: boolean
  ) => void | Promise<void>
  onConfigure: (mcpServer: McpServer) => void
  onRemove: (mcpServerId: string) => void
}
