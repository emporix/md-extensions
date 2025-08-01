import { useState, useEffect, useCallback } from 'react'
import { AgentService, PatchOperation } from '../services/agentService'
import { AgentTemplate, CustomAgent } from '../types/Agent'
import { AppState } from '../types/common'

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
  const [agents, setAgents] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([])
  const [customAgentsLoading, setCustomAgentsLoading] = useState(true)
  const [customAgentsError, setCustomAgentsError] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)

  const loadAgentTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const agentService = new AgentService(appState)
      const templates = await agentService.getAgentTemplates()
      setAgents(templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent templates')
    } finally {
      setLoading(false)
    }
  }, [appState])

  const loadCustomAgents = useCallback(async () => {
    try {
      setCustomAgentsLoading(true)
      setCustomAgentsError(null)
      
      const agentService = new AgentService(appState)
      const customAgentsList = await agentService.getCustomAgents()
      setCustomAgents(customAgentsList)
    } catch (err) {
      setCustomAgentsError(err instanceof Error ? err.message : 'Failed to load custom agents')
    } finally {
      setCustomAgentsLoading(false)
    }
  }, [appState])

  const toggleAgentActive = useCallback((agentId: string, enabled: boolean) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, enabled } : agent
      )
    )
  }, [])

  const toggleCustomAgentActive = useCallback(async (agentId: string, enabled: boolean) => {
    try {
      // Get the current agent data
      const currentAgent = customAgents.find(agent => agent.id === agentId)
      if (!currentAgent) {
        throw new Error('Agent not found')
      }

      // Optimistically update local state
      setCustomAgents(prev => 
        prev.map(agent => 
          agent.id === agentId ? { ...agent, enabled } : agent
        )
      )
      
      // Call API to update the agent using PATCH method
      const agentService = new AgentService(appState)
      const patches: PatchOperation[] = [
        {
          op: 'REPLACE',
          path: '/enabled',
          value: enabled
        }
      ]
      await agentService.patchCustomAgent(agentId, patches)
      
      // Refresh the list to ensure consistency
      await loadCustomAgents()
    } catch (err) {
      console.error('Failed to update agent enabled status:', err)
      
      // Revert local state on error
      setCustomAgents(prev => 
        prev.map(agent => 
          agent.id === agentId ? { ...agent, enabled: !enabled } : agent
        )
      )
      
      // You might want to show an error message here
    }
  }, [appState, loadCustomAgents, customAgents])

  const removeCustomAgent = useCallback((agentId: string) => {
    // Check if agent is active and prevent deletion
    const agent = customAgents.find(a => a.id === agentId)
    if (agent?.enabled) {
      console.warn('Cannot delete active agent:', agentId)
      return
    }
    
    setAgentToDelete(agentId)
    setDeleteConfirmVisible(true)
  }, [customAgents])

  const showDeleteConfirm = useCallback((agentId: string) => {
    setAgentToDelete(agentId)
    setDeleteConfirmVisible(true)
  }, [])

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false)
    setAgentToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!agentToDelete) return

    try {
      const agentService = new AgentService(appState)
      await agentService.deleteCustomAgent(agentToDelete)
      
      // Remove from local state
      setCustomAgents(prev => prev.filter(agent => agent.id !== agentToDelete))
      
      // Hide confirmation dialog
      hideDeleteConfirm()
    } catch (err) {
      console.error('Failed to delete agent:', err)
      // You might want to show an error message here
      hideDeleteConfirm()
    }
  }, [agentToDelete, appState, hideDeleteConfirm])

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