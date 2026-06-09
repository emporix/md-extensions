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

export const getNativeToolSectionTags = (
  tools: Tool[],
  maxTags = 3
): string[] => {
  const tags = new Set<string>()

  tools.forEach((tool) => {
    if (tool.type === 'slack') {
      tags.add('Slack')
      return
    }
    if (tool.type === 'rag_emporix' || tool.type === 'rag_custom') {
      tags.add('RAG Tools')
      return
    }
    if (tool.type) {
      tags.add(formatTagLabel(tool.type.replace(/_/g, '-')))
    }
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

export const isCustomMcpAttached = (
  mcpServers: McpServer[],
  serverId: string
): boolean =>
  mcpServers.some(
    (server) => server.type === 'custom' && server.mcpServer?.id === serverId
  )

export const toggleCustomMcpServer = (
  mcpServers: McpServer[],
  serverId: string,
  checked: boolean
): McpServer[] => {
  if (checked) {
    if (isCustomMcpAttached(mcpServers, serverId)) {
      return mcpServers
    }

    return [
      ...mcpServers,
      {
        type: 'custom' as const,
        mcpServer: { id: serverId },
      },
    ]
  }

  return mcpServers.filter(
    (server) => !(server.type === 'custom' && server.mcpServer?.id === serverId)
  )
}
