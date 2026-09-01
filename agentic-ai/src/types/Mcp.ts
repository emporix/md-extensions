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

export type ManagedMcpServerType = 'custom' | 'dynamic'

export enum McpToolInvocationMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum McpToolInvocationArgsLocation {
  BODY = 'body',
  QUERY = 'query',
}

export interface McpToolInvocation {
  functionId: string
  method: McpToolInvocationMethod | string
  argsLocation?: McpToolInvocationArgsLocation | string
}

export interface McpToolConfig {
  requiredScopes?: string[]
  inputSchema?: string
  invocation?: McpToolInvocation
}

export interface McpTool {
  name: string
  description?: string
  prompt?: string
  enabled?: boolean
  config?: McpToolConfig
}

export interface ProjectCloudFunction {
  id: string
  name: string
  runtime: string
}

export interface McpServer {
  id: string
  name: string
  type?: ManagedMcpServerType
  transport: CustomMcpServerTransportType
  config?: McpConfig
  tools?: McpTool[]
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
