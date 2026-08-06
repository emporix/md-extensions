import { NativeTool } from '../types/Agent'
import { Tool, ToolConfig } from '../types/Tool'

export const SLACK_TRIGGER = 'slack'

export const DEFAULT_SLACK_ALLOWED_OPERATIONS = [
  'sendMessage',
  'createChannel',
  'inviteParticipants',
  'collaborateOnChannel',
] as const

export const applySlackToolDefaults = (config: ToolConfig): ToolConfig => ({
  ...config,
  allowedOperations:
    config.allowedOperations == null
      ? [...DEFAULT_SLACK_ALLOWED_OPERATIONS]
      : config.allowedOperations,
})

export const toSlackToolConfigForSave = (config: ToolConfig): ToolConfig => {
  const normalized = applySlackToolDefaults(config)
  const defaultInboundAgentId = normalized.defaultInboundAgentId?.trim()

  if (defaultInboundAgentId) {
    return { ...normalized, defaultInboundAgentId }
  }

  const withoutDefault = { ...normalized }
  delete withoutDefault.defaultInboundAgentId
  return withoutDefault
}

export const getSlackToolsFromCatalog = (tools: Tool[]): Tool[] =>
  tools.filter((tool) => tool.type === 'slack')

export const getSelectedSlackToolIds = (
  nativeTools: NativeTool[],
  availableTools: Tool[]
): string[] => {
  const slackToolIds = new Set(
    getSlackToolsFromCatalog(availableTools).map((tool) => tool.id)
  )
  return nativeTools
    .map((tool) => tool.id)
    .filter((toolId) => slackToolIds.has(toolId))
}

export const toggleSlackNativeTool = (
  nativeTools: NativeTool[],
  availableTools: Tool[],
  toolId: string,
  checked: boolean
): NativeTool[] => {
  const slackToolIds = new Set(
    getSlackToolsFromCatalog(availableTools).map((tool) => tool.id)
  )
  const catalogTool = availableTools.find((tool) => tool.id === toolId)

  if (!slackToolIds.has(toolId)) {
    if (checked) {
      if (nativeTools.some((tool) => tool.id === toolId)) {
        return nativeTools
      }
      return [...nativeTools, { id: toolId }]
    }
    return nativeTools.filter((tool) => tool.id !== toolId)
  }

  if (checked) {
    const withoutSlackTools = nativeTools.filter(
      (tool) => !slackToolIds.has(tool.id)
    )
    return [
      ...withoutSlackTools,
      {
        id: toolId,
        allowedOperations: catalogTool
          ? getSlackToolAllowedOperations(catalogTool)
          : undefined,
      },
    ]
  }

  return nativeTools.filter((tool) => tool.id !== toolId)
}

export const updateSlackNativeToolAllowedOperations = (
  nativeTools: NativeTool[],
  toolId: string,
  operation: string,
  checked: boolean,
  availableTool: Tool
): NativeTool[] => {
  const allowedByTool = getSlackToolAllowedOperations(availableTool)
  if (!allowedByTool.includes(operation)) {
    return nativeTools
  }

  return nativeTools.map((nativeTool) => {
    if (nativeTool.id !== toolId) {
      return nativeTool
    }

    const current = nativeTool.allowedOperations ?? allowedByTool
    if (!checked && current.length <= 1 && current.includes(operation)) {
      return nativeTool
    }
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

export const slackNativeToolHasAllowedOperations = (
  nativeTool: NativeTool | undefined,
  availableTool: Tool | undefined
): boolean => {
  if (!nativeTool || !availableTool || availableTool.type !== 'slack') {
    return true
  }

  const allowedByTool = getSlackToolAllowedOperations(availableTool)
  const selected = nativeTool.allowedOperations ?? allowedByTool
  return selected.length > 0
}

export const areSlackAgentToolsValid = (
  nativeTools: NativeTool[],
  availableTools: Tool[]
): boolean => getSelectedSlackToolIds(nativeTools, availableTools).length <= 1

export const countSlackToolsForTeam = (
  tools: Tool[],
  teamId?: string,
  excludeToolId?: string
): number =>
  tools.filter(
    (tool) =>
      tool.type === 'slack' &&
      tool.id !== excludeToolId &&
      (!teamId || tool.config.teamId === teamId)
  ).length

export const getSlackToolAllowedOperations = (tool: Tool): string[] =>
  tool.config.allowedOperations && tool.config.allowedOperations.length > 0
    ? tool.config.allowedOperations
    : [...DEFAULT_SLACK_ALLOWED_OPERATIONS]
