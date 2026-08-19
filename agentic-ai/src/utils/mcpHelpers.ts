import {
  CustomMcpServerTransportType,
  ManagedMcpServerType,
  McpServer,
  McpTool,
  McpToolInvocationArgsLocation,
  McpToolInvocationMethod,
} from '../types/Mcp'
import { TFunction } from 'i18next'

export const MCP_TOOL_NAME_PATTERN = /^\S+$/

export const isDynamicMcpServer = (
  mcpServer: Pick<McpServer, 'type'>
): boolean => mcpServer.type === 'dynamic'

export const getDynamicMcpToolCounts = (mcpServer: Pick<McpServer, 'tools'>) => {
  const tools = mcpServer.tools ?? []
  const enabled = tools.filter((tool) => tool.enabled !== false).length
  return { enabled, total: tools.length }
}

export const createEmptyMcpTool = (): McpTool => ({
  name: '',
  description: '',
  prompt: '',
  enabled: true,
  config: {
    requiredScopes: [],
    inputSchema: '{"type":"object"}',
    invocation: {
      functionId: '',
      method: McpToolInvocationMethod.POST,
      argsLocation: McpToolInvocationArgsLocation.BODY,
    },
  },
})

export const createEmptyMcpDraft = (): McpServer => ({
  id: '',
  name: '',
  transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
  enabled: true,
})

export const createEmptyMcpServer = (): McpServer => ({
  id: '',
  name: '',
  type: 'custom',
  transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
  config: {
    url: '',
  },
  enabled: true,
})

export const createEmptyDynamicMcpServer = (): McpServer => ({
  id: '',
  name: '',
  type: 'dynamic',
  transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
  enabled: true,
  tools: [createEmptyMcpTool()],
})

export const getMcpServerTypeLabel = (
  t: TFunction,
  type: ManagedMcpServerType
): string =>
  type === 'dynamic' ? t('dynamic_mcp_server') : t('custom_mcp_server')

export const switchMcpServerType = (
  type: ManagedMcpServerType,
  current?: Pick<McpServer, 'id' | 'name' | 'enabled'>
): McpServer => {
  const base =
    type === 'dynamic' ? createEmptyDynamicMcpServer() : createEmptyMcpServer()

  return {
    ...base,
    id: current?.id ?? base.id,
    name: current?.name ?? base.name,
    enabled: current?.enabled ?? base.enabled,
  }
}

const buildMcpToolUpsertPayload = (tool: McpTool) => {
  const invocation = tool.config?.invocation
  const argsLocation = invocation?.argsLocation

  return {
    name: tool.name.trim(),
    ...(tool.description?.trim() ? { description: tool.description.trim() } : {}),
    prompt: tool.prompt?.trim() ?? '',
    enabled: tool.enabled ?? true,
    config: {
      inputSchema: tool.config?.inputSchema?.trim() ?? '',
      ...(tool.config?.requiredScopes?.length
        ? { requiredScopes: tool.config.requiredScopes.filter(Boolean) }
        : {}),
      invocation: {
        functionId: invocation?.functionId?.trim() ?? '',
        method: invocation?.method ?? McpToolInvocationMethod.POST,
        ...(argsLocation ? { argsLocation } : {}),
      },
    },
  }
}

export const buildMcpServerUpsertPayload = (
  mcpServer: McpServer
): Record<string, unknown> => {
  const base = {
    name: mcpServer.name.trim(),
    enabled: mcpServer.enabled ?? true,
  }

  if (isDynamicMcpServer(mcpServer)) {
    return {
      ...base,
      type: 'dynamic',
      transport:
        mcpServer.transport ?? CustomMcpServerTransportType.STREAMABLE_HTTP,
      tools: (mcpServer.tools ?? []).map(buildMcpToolUpsertPayload),
    }
  }

  const config = mcpServer.config
  return {
    ...base,
    type: 'custom',
    transport: mcpServer.transport,
    config: {
      url: config?.url?.trim() ?? '',
      ...(config?.authorizationHeaderName?.trim()
        ? { authorizationHeaderName: config.authorizationHeaderName.trim() }
        : {}),
      ...(config?.authorizationHeaderToken?.id
        ? { authorizationHeaderToken: { id: config.authorizationHeaderToken.id } }
        : {}),
    },
  }
}

export const getMcpServerDescription = (
  t: TFunction,
  mcpServer: McpServer
): string => {
  if (isDynamicMcpServer(mcpServer)) {
    const { enabled, total } = getDynamicMcpToolCounts(mcpServer)
    return t('dynamic_mcp_tools_summary', { enabled, total })
  }

  const parts: string[] = []
  if (mcpServer.config?.url) {
    parts.push(`${t('url')}: ${mcpServer.config.url}`)
  }
  if (mcpServer.config?.authorizationHeaderName) {
    parts.push(
      `${t('authorization_header_name')}: ${mcpServer.config.authorizationHeaderName}`
    )
  }

  return parts.length > 0 ? parts.join('\n') : t('custom_mcp_server')
}

export const getMcpServerBadgeLabel = (
  t: TFunction,
  mcpServer: McpServer
): string => {
  if (isDynamicMcpServer(mcpServer)) {
    return t('dynamic_mcp_tag')
  }

  return getMcpTransportLabel(t, mcpServer.transport)
}

export const getMcpTransportLabel = (
  t: TFunction,
  transport: CustomMcpServerTransportType | string
): string => {
  switch (transport) {
    case CustomMcpServerTransportType.SSE:
      return t('mcp_transport_sse')
    case CustomMcpServerTransportType.STREAMABLE_HTTP:
      return t('mcp_transport_streamable_http')
    default:
      return String(transport).toUpperCase()
  }
}

export const getMcpTransportOptions = (t: TFunction) => [
  {
    label: t('mcp_transport_sse'),
    value: CustomMcpServerTransportType.SSE,
  },
  {
    label: t('mcp_transport_streamable_http'),
    value: CustomMcpServerTransportType.STREAMABLE_HTTP,
  },
]

export const getMcpToolInvocationMethodOptions = () =>
  Object.values(McpToolInvocationMethod).map((method) => ({
    label: method,
    value: method,
  }))

export const getMcpToolArgsLocationOptions = (t: TFunction) => [
  { label: t('mcp_tool_args_location_body'), value: McpToolInvocationArgsLocation.BODY },
  { label: t('mcp_tool_args_location_query'), value: McpToolInvocationArgsLocation.QUERY },
]
