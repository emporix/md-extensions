import { useState, useEffect, useCallback, useMemo } from 'react'
import { PatchOperation } from '../services/agentService'
import { AgentTemplate, CustomAgent } from '../types/Agent'
import { AppState } from '../types/common'
import { useToast } from '../contexts/ToastContext'
import { formatApiError } from '../utils/errorHelpers'
import { ServiceFactory } from '../services/serviceFactory'
import { useDeleteConfirmation } from './useDeleteConfirmation'

interface UseAgentsResult {
  agents: AgentTemplate[]
  loading: boolean
  error: string | null

  customAgents: CustomAgent[]
  customAgentsLoading: boolean
  customAgentsError: string | null

  toggleAgentActive: (agentId: string, enabled: boolean) => void
  toggleCustomAgentActive: (agentId: string, enabled: boolean) => Promise<void>
  removeCustomAgent: (agentId: string) => void
  refreshAgents: () => Promise<void>
  refreshCustomAgents: () => Promise<void>
  setCustomAgents: React.Dispatch<React.SetStateAction<CustomAgent[]>>

  // Delete confirmation state
  deleteConfirmVisible: boolean
  agentToDelete: string | null
  showDeleteConfirm: (agentId: string) => void
  hideDeleteConfirm: () => void
  confirmDelete: () => Promise<void>
}

export const useAgents = (appState: AppState): UseAgentsResult => {
  const { showSuccess, showError } = useToast()
  const [agents, setAgents] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([])
  const [customAgentsLoading, setCustomAgentsLoading] = useState(true)
  const [customAgentsError, setCustomAgentsError] = useState<string | null>(
    null
  )

  const agentService = useMemo(
    () => ServiceFactory.getAgentService(appState),
    [appState]
  )

  const {
    deleteConfirmVisible,
    itemToDelete: agentToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
  } = useDeleteConfirmation({
    onDelete: async (agentId: string) => {
      await agentService.deleteCustomAgent(agentId)
    },
    onSuccess: (agentId: string) => {
      setCustomAgents((prev) => prev.filter((agent) => agent.id !== agentId))
    },
    successMessage: 'Agent deleted successfully!',
    errorMessage: 'Failed to delete agent',
  })

  const loadAgentTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const templates = await agentService.getAgentTemplates()
      setAgents(templates)
    } catch (err) {
      const errorMessage = formatApiError(err, 'Failed to load agent templates')
      setError(errorMessage)
      showError(`Error loading agent templates: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [agentService, showError])

  const loadCustomAgents = useCallback(async () => {
    try {
      setCustomAgentsLoading(true)
      setCustomAgentsError(null)

      const customAgentsList = await agentService.getCustomAgents()
      setCustomAgents(customAgentsList)
    } catch (err) {
      const errorMessage = formatApiError(err, 'Failed to load custom agents')
      setCustomAgentsError(errorMessage)
      showError(`Error loading custom agents: ${errorMessage}`)
    } finally {
      setCustomAgentsLoading(false)
    }
  }, [agentService, showError])

  const toggleAgentActive = useCallback((agentId: string, enabled: boolean) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, enabled } : agent
      )
    )
  }, [])

  const toggleCustomAgentActive = useCallback(
    async (agentId: string, enabled: boolean) => {
      try {
        // Get the current agent data
        const currentAgent = customAgents.find((agent) => agent.id === agentId)
        if (!currentAgent) {
          throw new Error('Agent not found')
        }

        // Optimistically update local state
        setCustomAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId ? { ...agent, enabled } : agent
          )
        )

        // Call API to update the agent using PATCH method
        const patches: PatchOperation[] = [
          {
            op: 'REPLACE',
            path: '/enabled',
            value: enabled,
          },
        ]
        await agentService.patchCustomAgent(agentId, patches)

        showSuccess(
          `Agent ${enabled ? 'activated' : 'deactivated'} successfully!`
        )

        // Refresh the list to ensure consistency
        await loadCustomAgents()
      } catch (err) {
        const errorMessage = formatApiError(
          err,
          'Failed to update agent status'
        )
        showError(`Error updating agent: ${errorMessage}`)

        // Revert local state on error
        setCustomAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId ? { ...agent, enabled: !enabled } : agent
          )
        )
      }
    },
    [loadCustomAgents, customAgents, showError, showSuccess, agentService]
  )

  const removeCustomAgent = useCallback(
    (agentId: string) => {
      // Check if agent is active and prevent deletion
      const agent = customAgents.find((a) => a.id === agentId)
      if (agent?.enabled) {
        showError('Cannot delete active agent. Please disable the agent first.')
        return
      }

      showDeleteConfirm(agentId)
    },
    [customAgents, showError, showDeleteConfirm]
  )

  useEffect(() => {
    loadAgentTemplates()
    loadCustomAgents()
  }, [loadAgentTemplates, loadCustomAgents])

  return {
    agents,
    loading,
    error,
    customAgents,
    customAgentsLoading,
    customAgentsError,
    toggleAgentActive,
    toggleCustomAgentActive,
    removeCustomAgent,
    refreshAgents: loadAgentTemplates,
    refreshCustomAgents: loadCustomAgents,
    setCustomAgents,
    deleteConfirmVisible,
    agentToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
  }
}
