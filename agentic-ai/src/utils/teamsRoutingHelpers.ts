import { NativeTool } from '../types/Agent'
import { Tool, ToolConfig } from '../types/Tool'

export const TEAMS_TRIGGER = 'teams'

export const DEFAULT_TEAMS_ALLOWED_OPERATIONS = [
  'sendMessage',
  'createChat',
  'createChannel',
  'inviteParticipants',
  'collaborateOnChannel',
  'collaborateOnChat',
] as const

export const applyTeamsToolDefaults = (config: ToolConfig): ToolConfig => ({
  ...config,
  allowedOperations:
    config.allowedOperations == null
      ? [...DEFAULT_TEAMS_ALLOWED_OPERATIONS]
      : config.allowedOperations,
})

export const toTeamsToolConfigForSave = (config: ToolConfig): ToolConfig => {
  const normalized = applyTeamsToolDefaults(config)
  const defaultInboundAgentId = normalized.defaultInboundAgentId?.trim()

  if (defaultInboundAgentId) {
    return { ...normalized, defaultInboundAgentId }
  }

  const withoutDefault = { ...normalized }
  delete withoutDefault.defaultInboundAgentId
  return withoutDefault
}

export const getTeamsToolsFromCatalog = (tools: Tool[]): Tool[] =>
  tools.filter((tool) => tool.type === 'teams')

export const getSelectedTeamsToolIds = (
  nativeTools: NativeTool[],
  availableTools: Tool[]
): string[] => {
  const teamsToolIds = new Set(
    getTeamsToolsFromCatalog(availableTools).map((tool) => tool.id)
  )
  return nativeTools
    .map((tool) => tool.id)
    .filter((toolId) => teamsToolIds.has(toolId))
}

export const toggleTeamsNativeTool = (
  nativeTools: NativeTool[],
  availableTools: Tool[],
  toolId: string,
  checked: boolean
): NativeTool[] => {
  const teamsToolIds = new Set(
    getTeamsToolsFromCatalog(availableTools).map((tool) => tool.id)
  )
  const catalogTool = availableTools.find((tool) => tool.id === toolId)

  if (!teamsToolIds.has(toolId)) {
    if (checked) {
      if (nativeTools.some((tool) => tool.id === toolId)) {
        return nativeTools
      }
      return [...nativeTools, { id: toolId }]
    }
    return nativeTools.filter((tool) => tool.id !== toolId)
  }

  if (checked) {
    const withoutTeamsTools = nativeTools.filter(
      (tool) => !teamsToolIds.has(tool.id)
    )
    return [
      ...withoutTeamsTools,
      {
        id: toolId,
        allowedOperations: catalogTool
          ? getToolAllowedOperations(catalogTool)
          : undefined,
      },
    ]
  }

  return nativeTools.filter((tool) => tool.id !== toolId)
}

export const updateTeamsNativeToolAllowedOperations = (
  nativeTools: NativeTool[],
  toolId: string,
  operation: string,
  checked: boolean,
  availableTool: Tool
): NativeTool[] => {
  const allowedByTool = getToolAllowedOperations(availableTool)
  if (!allowedByTool.includes(operation)) {
    return nativeTools
  }

  return nativeTools.map((nativeTool) => {
    if (nativeTool.id !== toolId) {
      return nativeTool
    }

    const current = nativeTool.allowedOperations ?? allowedByTool
    const next = checked
      ? current.includes(operation)
        ? current
        : [...current, operation].sort((a, b) => a.localeCompare(b))
      : current.filter((entry) => entry !== operation)

    return {
      ...nativeTool,
      allowedOperations: next,
    }
  })
}

export const teamsNativeToolHasAllowedOperations = (
  nativeTool: NativeTool | undefined,
  availableTool: Tool | undefined
): boolean => {
  if (!nativeTool || !availableTool || availableTool.type !== 'teams') {
    return true
  }

  const allowedByTool = getToolAllowedOperations(availableTool)
  const selected = nativeTool.allowedOperations ?? allowedByTool
  return selected.length > 0
}

export const areTeamsAgentToolsValid = (
  nativeTools: NativeTool[],
  availableTools: Tool[]
): boolean => getSelectedTeamsToolIds(nativeTools, availableTools).length <= 1

export const countTeamsToolsForTeam = (
  tools: Tool[],
  teamId?: string,
  tenantId?: string,
  excludeToolId?: string
): number =>
  tools.filter(
    (tool) =>
      tool.type === 'teams' &&
      tool.id !== excludeToolId &&
      (!teamId || tool.config.teamId === teamId) &&
      (!tenantId || tool.config.tenantId === tenantId)
  ).length

export const getToolAllowedOperations = (tool: Tool): string[] =>
  tool.config.allowedOperations && tool.config.allowedOperations.length > 0
    ? tool.config.allowedOperations
    : [...DEFAULT_TEAMS_ALLOWED_OPERATIONS]
