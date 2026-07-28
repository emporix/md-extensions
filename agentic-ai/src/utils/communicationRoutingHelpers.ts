import { Tool } from '../types/Tool'
import { getSlackToolAllowedOperations } from './slackRoutingHelpers'
import { getToolAllowedOperations as getTeamsToolAllowedOperations } from './teamsRoutingHelpers'

export const isCommunicationNativeToolType = (
  toolType?: string
): toolType is 'teams' | 'slack' => toolType === 'teams' || toolType === 'slack'

export const getCommunicationToolAllowedOperations = (tool: Tool): string[] => {
  if (tool.type === 'slack') {
    return getSlackToolAllowedOperations(tool)
  }
  if (tool.type === 'teams') {
    return getTeamsToolAllowedOperations(tool)
  }
  return []
}
