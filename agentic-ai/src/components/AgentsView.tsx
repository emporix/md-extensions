import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Message } from 'primereact/message'
import { Button } from 'primereact/button'
import CustomAgentCard from './CustomAgentCard'
import PredefinedAgentCard from './PredefinedAgentCard'
import AddAgentDialog from './AddAgentDialog'
import AgentConfigPanel from './AgentConfigPanel'
import { ErrorBoundary } from './common/ErrorBoundary'
import { ConfirmDialog } from './common/ConfirmDialog'
import { AppState } from '../types/common'
import { useAgents } from '../hooks/useAgents'
import { AgentTemplate } from '../types/Agent'
import { CustomAgent } from '../types/Agent'
import { cleanAgentForConfig, createEmptyAgent } from '../utils/agentHelpers'

interface AgentsViewProps {
  appState: AppState
}

const AgentsView = memo(({ appState }: AgentsViewProps) => {
  const { t, i18n } = useTranslation()
  
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState<AgentTemplate | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [selectedCustomAgent, setSelectedCustomAgent] = useState<CustomAgent | null>(null)
  
  const {
    agents,
    loading,
    error,
    customAgents,
    customAgentsLoading,
    customAgentsError,
    toggleAgentActive,
    toggleCustomAgentActive,
    removeCustomAgent,
    setCustomAgents,
    refreshCustomAgents,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete
  } = useAgents(appState)



  const handleAddAgent = useCallback((agentId: string) => {
    const agentTemplate = agents.find(agent => agent.id === agentId)
    if (agentTemplate) {
      setSelectedAgentTemplate(agentTemplate)
      setShowAddAgentDialog(true)
    }
  }, [agents])

  const handleSaveAgent = async (_name: string, _description: string, _templateId: string) => {
    await refreshCustomAgents();
    setShowAddAgentDialog(false);
    setSelectedAgentTemplate(null);
  }

  const handleCloseDialog = () => {
    setShowAddAgentDialog(false)
    setSelectedAgentTemplate(null)
  }



  const handleAddNewAgent = useCallback(() => {
    setSelectedCustomAgent(createEmptyAgent())
    setShowConfigPanel(true)
  }, [])

  const handleConfigure = useCallback((agent: CustomAgent) => {
    const cleanAgent = cleanAgentForConfig(agent, i18n.language)
    setSelectedCustomAgent(cleanAgent)
    setShowConfigPanel(true)
  }, [i18n.language])

  const handleConfigSave = async (updatedAgent: CustomAgent) => {
    try {
      await refreshCustomAgents()
      setShowConfigPanel(false)
      setSelectedCustomAgent(null)
    } catch (error) {
      console.error('Failed to refresh agents after save:', error)
      const cleanAgent = cleanAgentForConfig(updatedAgent, i18n.language)
      setCustomAgents((prev: CustomAgent[]) => prev.map((a: CustomAgent) => a.id === cleanAgent.id ? cleanAgent : a))
      setShowConfigPanel(false)
      setSelectedCustomAgent(null)
    }
  }

  const handleConfigClose = useCallback(() => {
    setShowConfigPanel(false)
    setSelectedCustomAgent(null)
  }, [])

  if (loading || customAgentsLoading) {
    return (
      <div className="agents-loading">
        <ProgressSpinner />
        <p>{t('loading', 'Loading agents...')}</p>
      </div>
    )
  }

  if (error && customAgentsError) {
    return (
      <div className="agents-error">
        <Message severity="error" text={`${error} | ${customAgentsError}`} />
      </div>
    )
  }

  return (
    <div className="agents-view">
      {/* Header */}
      <div className="agents-header">
        <h1 className="agents-title">{t('custom_ai_agents', 'Agentic AI')}</h1>
        <Button
          label={t('add_new_agent', 'ADD NEW AGENT')}
          className="add-new-agent-button"
          onClick={handleAddNewAgent}
        />
      </div>

      {/* My Agents Section */}
      <div className="my-agents-section">
        <h2 className="section-title">{t('my_agents', 'My Agents')}</h2>
        
        {customAgentsError ? (
          <Message severity="error" text={customAgentsError} />
        ) : customAgents.length > 0 ? (
          <div className="agents-grid">
            {customAgents.map(agent => (
              <CustomAgentCard
                key={agent.id}
                agent={agent}
                onToggleActive={toggleCustomAgentActive}
                onConfigure={handleConfigure}
                onRemove={removeCustomAgent}
              />
            ))}
          </div>
        ) : (
          <div className="no-agents-message">
            <p>{t('no_custom_agents', 'No custom agents created yet.')}</p>
          </div>
        )}
      </div>

      {/* Predefined Agents Section */}
      <div className="predefined-agents-section">
        <div className="section-header">
          <h2 className="section-title">{t('predefined_agents', 'Predefined Agents')}</h2>
          <p className="section-description">
            {t('predefined_agents_description', 'We have number of available Agents in our system. Add any to your list, rename it, to make the desired achievement.')}
          </p>
        </div>
        
        {error ? (
          <Message severity="error" text={error} />
        ) : (
          <div className="agents-grid">
            {agents.map(agent => (
              <PredefinedAgentCard
                key={agent.id}
                agent={agent}
                onToggleActive={toggleAgentActive}
                onAddAgent={handleAddAgent}
              />
            ))}
          </div>
        )}
      </div>

      <AddAgentDialog
        visible={showAddAgentDialog}
        agentTemplate={selectedAgentTemplate}
        onHide={handleCloseDialog}
        onSave={handleSaveAgent}
        appState={appState}
      />

      <ErrorBoundary>
        <AgentConfigPanel
          visible={showConfigPanel}
          agent={selectedCustomAgent}
          onHide={handleConfigClose}
          onSave={handleConfigSave}
          appState={appState}
          availableAgents={customAgents}
        />
      </ErrorBoundary>

      <ConfirmDialog
        visible={deleteConfirmVisible}
        onHide={hideDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('delete_agent', 'Delete Agent')}
        message={t('delete_agent_confirmation', 'Are you sure you want to delete this agent? This action cannot be undone.')}
        confirmLabel={t('delete', 'Delete')}
        cancelLabel={t('cancel', 'Cancel')}
        severity="danger"
      />
    </div>
  )
});

AgentsView.displayName = 'AgentsView';

export default AgentsView; 