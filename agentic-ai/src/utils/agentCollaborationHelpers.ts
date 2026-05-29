import { AgentCollaboration, CustomAgent } from '../types/Agent'
import { getLocalizedValue } from './agentHelpers'

export const isCollaborationRowValid = (
  agentId: string | null | undefined,
  description: string
): boolean => Boolean(agentId?.trim() && description.trim())

export const buildCollaboration = (
  agentId: string,
  prompt: string
): AgentCollaboration => ({
  agentId,
  description: prompt.trim(),
})

export const isCollaborationAgentAllowed = (
  agent: CustomAgent,
  currentAgentType?: string
): boolean => {
  if (agent.id === 'emporix--collaboration') {
    return currentAgentType === 'complaint' || currentAgentType === 'anti_fraud'
  }

  return true
}

export const filterCollaborationAgentOptions = (
  agents: CustomAgent[],
  currentAgentId: string | undefined,
  usedAgentIds: string[],
  currentAgentType?: string,
  editingAgentId?: string,
  contentLanguage = 'en'
): CustomAgent[] => {
  const usedSet = new Set(
    usedAgentIds.filter((id) => id !== editingAgentId?.trim())
  )

  return agents
    .filter((agent) => {
      if (currentAgentId && agent.id === currentAgentId) {
        return false
      }

      if (usedSet.has(agent.id)) {
        return false
      }

      return isCollaborationAgentAllowed(agent, currentAgentType)
    })
    .sort((left, right) =>
      getLocalizedValue(left.name, contentLanguage)
        .toLowerCase()
        .localeCompare(
          getLocalizedValue(right.name, contentLanguage).toLowerCase()
        )
    )
}

export const getUsedCollaborationAgentIds = (
  collaborations: AgentCollaboration[]
): string[] =>
  collaborations
    .map((item) => item.agentId.trim())
    .filter((agentId) => agentId.length > 0)

export const getUsedCollaborationAgentIdsExcludingRow = (
  collaborations: AgentCollaboration[],
  excludeRowIndex: number
): string[] =>
  collaborations
    .filter((_, index) => index !== excludeRowIndex)
    .map((item) => item.agentId.trim())
    .filter((agentId) => agentId.length > 0)

export const getValidCollaborations = (
  collaborations: AgentCollaboration[]
): AgentCollaboration[] =>
  collaborations
    .filter((item) => isCollaborationRowValid(item.agentId, item.description))
    .map((item) => buildCollaboration(item.agentId, item.description))

export const isEmptyCollaborationRow = (row: AgentCollaboration): boolean =>
  !row.agentId.trim() && !row.description.trim()

export const getCollaborationRows = (
  collaborations: AgentCollaboration[]
): AgentCollaboration[] => {
  const baseRows =
    collaborations.length > 0
      ? collaborations
      : [{ agentId: '', description: '' }]

  const lastRow = baseRows[baseRows.length - 1]
  if (lastRow.agentId.trim()) {
    return [...baseRows, { agentId: '', description: '' }]
  }

  return baseRows
}

export const isCollaborationPromptMissing = (
  agentId: string,
  description: string
): boolean => Boolean(agentId.trim() && !description.trim())

export const areCollaborationsValid = (
  collaborations: AgentCollaboration[]
): boolean =>
  getCollaborationRows(collaborations).every((row) => {
    const hasAgent = Boolean(row.agentId.trim())
    const hasPrompt = Boolean(row.description.trim())

    if (hasAgent) {
      return hasPrompt
    }

    return !hasPrompt
  })
