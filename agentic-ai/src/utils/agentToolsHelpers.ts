import { McpServer, NativeTool } from '../types/Agent'
import { Tool } from '../types/Tool'
import { MCP_SERVERS, MCP_DOMAIN_TAGS, McpKey } from './constants'

const formatTagLabel = (segment: string): string =>
  segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const formatDomainSectionTitle = (domain: McpKey): string => {
  const baseName = MCP_SERVERS[domain].name.replace(/\s+MCP$/i, '')
  return `${baseName} Domain Tools`
}

export const getDomainSectionTags = (domain: McpKey): string[] => [
  ...MCP_DOMAIN_TAGS[domain],
]

export const getNativeToolTags = (tool: Pick<Tool, 'type'>): string[] => {
  if (tool.type === 'slack') {
    return ['Slack']
  }
  if (tool.type === 'teams') {
    return ['Microsoft Teams']
  }
  if (tool.type === 'rag_emporix' || tool.type === 'rag_custom') {
    return ['RAG Tools']
  }
  if (tool.type) {
    return [formatTagLabel(tool.type.replace(/_/g, '-'))]
  }
  return []
}

export const getNativeToolSectionTags = (
  tools: Tool[],
  maxTags = 3
): string[] => {
  const tags = new Set<string>()

  tools.forEach((tool) => {
    getNativeToolTags(tool).forEach((tag) => tags.add(tag))
  })

  return [...tags].sort((a, b) => a.localeCompare(b)).slice(0, maxTags)
}

export const getPredefinedMcpForDomain = (
  mcpServers: McpServer[],
  domain: McpKey
): McpServer | undefined =>
  mcpServers.find(
    (server) => server.type === 'predefined' && server.domain === domain
  )

export const getSelectedDomainTools = (
  mcpServers: McpServer[],
  domain: McpKey
): string[] => getPredefinedMcpForDomain(mcpServers, domain)?.tools ?? []

export const toggleDomainTool = (
  mcpServers: McpServer[],
  domain: McpKey,
  toolId: string,
  checked: boolean
): McpServer[] => {
  const existing = getPredefinedMcpForDomain(mcpServers, domain)
  const currentTools = existing?.tools ?? []

  if (checked) {
    if (currentTools.includes(toolId)) {
      return mcpServers
    }

    const nextTools = [...currentTools, toolId].sort((a, b) =>
      a.localeCompare(b)
    )

    if (existing) {
      return mcpServers.map((server) =>
        server.type === 'predefined' && server.domain === domain
          ? { ...server, tools: nextTools }
          : server
      )
    }

    return [
      ...mcpServers,
      {
        type: 'predefined' as const,
        domain,
        tools: nextTools,
      },
    ]
  }

  if (!existing) {
    return mcpServers
  }

  const nextTools = currentTools.filter((tool) => tool !== toolId)
  if (nextTools.length === 0) {
    return mcpServers.filter(
      (server) => !(server.type === 'predefined' && server.domain === domain)
    )
  }

  return mcpServers.map((server) =>
    server.type === 'predefined' && server.domain === domain
      ? { ...server, tools: nextTools }
      : server
  )
}

export const toggleNativeTool = (
  nativeTools: NativeTool[],
  toolId: string,
  checked: boolean
): NativeTool[] => {
  if (checked) {
    if (nativeTools.some((tool) => tool.id === toolId)) {
      return nativeTools
    }
    return [...nativeTools, { id: toolId }]
  }

  return nativeTools.filter((tool) => tool.id !== toolId)
}

export const isManagedAgentMcp = (server: McpServer): boolean =>
  (server.type === 'custom' || server.type === 'dynamic') &&
  Boolean(server.mcpServer?.id)

export const isManagedMcpAttached = (
  mcpServers: McpServer[],
  serverId: string
): boolean =>
  mcpServers.some(
    (server) =>
      isManagedAgentMcp(server) && server.mcpServer?.id === serverId
  )

export const getAttachedManagedMcp = (
  mcpServers: McpServer[],
  serverId: string
): McpServer | undefined =>
  mcpServers.find(
    (server) =>
      isManagedAgentMcp(server) && server.mcpServer?.id === serverId
  )

export const toggleManagedMcpServer = (
  mcpServers: McpServer[],
  serverId: string,
  checked: boolean,
  mcpType: 'custom' | 'dynamic'
): McpServer[] => {
  if (checked) {
    if (isManagedMcpAttached(mcpServers, serverId)) {
      return mcpServers
    }

    return [
      ...mcpServers,
      mcpType === 'dynamic'
        ? { type: 'dynamic' as const, mcpServer: { id: serverId } }
        : { type: 'custom' as const, mcpServer: { id: serverId } },
    ]
  }

  return mcpServers.filter(
    (server) =>
      !(isManagedAgentMcp(server) && server.mcpServer?.id === serverId)
  )
}

export const getSelectedDynamicMcpTools = (
  mcpServers: McpServer[],
  serverId: string,
  enabledToolNames: string[]
): string[] => {
  const attached = getAttachedManagedMcp(mcpServers, serverId)
  if (!attached) {
    return []
  }
  if (attached.tools == null || attached.tools.length === 0) {
    return enabledToolNames
  }
  const enabledSet = new Set(enabledToolNames)
  return attached.tools.filter((toolName) => enabledSet.has(toolName))
}

export const formatManagedMcpServerLabel = (
  serverName: string,
  toolNames: string[],
  includeTools: boolean
): string => {
  if (!includeTools || toolNames.length === 0) {
    return serverName
  }
  return `${serverName} (${toolNames.join(', ')})`
}

const sameToolSet = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false
  }
  const sortedRight = [...right].sort((a, b) => a.localeCompare(b))
  return [...left]
    .sort((a, b) => a.localeCompare(b))
    .every((name, index) => name === sortedRight[index])
}

export const toggleDynamicMcpTool = (
  mcpServers: McpServer[],
  serverId: string,
  toolName: string,
  checked: boolean,
  enabledToolNames: string[]
): McpServer[] => {
  const existing = getAttachedManagedMcp(mcpServers, serverId)
  const currentTools = existing
    ? getSelectedDynamicMcpTools(mcpServers, serverId, enabledToolNames)
    : []

  const nextTools = checked
    ? currentTools.includes(toolName)
      ? currentTools
      : [...currentTools, toolName]
    : currentTools.filter((tool) => tool !== toolName)

  const uniqueSorted = [...new Set(nextTools)].sort((a, b) =>
    a.localeCompare(b)
  )

  if (uniqueSorted.length === 0) {
    return mcpServers
  }

  const nextEntry: McpServer = sameToolSet(uniqueSorted, enabledToolNames)
    ? { type: 'dynamic', mcpServer: { id: serverId } }
    : { type: 'dynamic', mcpServer: { id: serverId }, tools: uniqueSorted }

  if (existing) {
    return mcpServers.map((server) =>
      isManagedAgentMcp(server) && server.mcpServer?.id === serverId
        ? nextEntry
        : server
    )
  }

  return [...mcpServers, nextEntry]
}

export const hasManagedMcpAttachmentsChanged = (
  current: McpServer[],
  next: McpServer[]
): boolean => {
  if (current.length !== next.length) {
    return true
  }
  return next.some((server, index) => {
    const previous = current[index]
    if (server.type !== previous?.type) {
      return true
    }
    if (server.mcpServer?.id !== previous?.mcpServer?.id) {
      return true
    }
    const nextTools = server.tools ?? []
    const previousTools = previous?.tools ?? []
    if (nextTools.length !== previousTools.length) {
      return true
    }
    return nextTools.some((tool, toolIndex) => tool !== previousTools[toolIndex])
  })
}

export const normalizeManagedMcpAttachments = (
  mcpServers: McpServer[],
  managedMcpServers: { id: string; type?: string }[]
): McpServer[] =>
  mcpServers.map((server) => {
    if (!isManagedAgentMcp(server)) {
      return server
    }
    const mcpType = managedMcpServers.find(
      (item) => item.id === server.mcpServer?.id
    )?.type
    if (mcpType === 'dynamic' && server.type !== 'dynamic') {
      return { ...server, type: 'dynamic' as const }
    }
    if (mcpType === 'custom' && server.type === 'dynamic') {
      const { tools: _tools, ...rest } = server
      return { type: 'custom' as const, mcpServer: rest.mcpServer }
    }
    return server
  })
