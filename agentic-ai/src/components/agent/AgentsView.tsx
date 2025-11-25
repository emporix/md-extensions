import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Message } from 'primereact/message'
import CustomAgentCard from './CustomAgentCard'
import PredefinedAgentCard from './PredefinedAgentCard'
import AddAgentDialog from './AddAgentDialog'
import ImportAgentDialog from './ImportAgentDialog'
import AgentConfigPanel from './AgentConfigPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { BasePage } from '../shared/BasePage'
import { AppState } from '../../types/common'
import { useAgents } from '../../hooks/useAgents'
import { AgentTemplate } from '../../types/Agent'
import { CustomAgent } from '../../types/Agent'
import { cleanAgentForConfig, createEmptyAgent } from '../../utils/agentHelpers'

interface AgentsViewProps {
  appState: AppState
}

const AgentsView = memo(({ appState }: AgentsViewProps) => {
  const { t, i18n } = useTranslation()

  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [selectedAgentTemplate, setSelectedAgentTemplate] =
    useState<AgentTemplate | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [selectedCustomAgent, setSelectedCustomAgent] =
    useState<CustomAgent | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

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
    confirmDelete,
  } = useAgents(appState)

  const handleAddAgent = useCallback(
    (agentId: string) => {
      const agentTemplate = agents.find((agent) => agent.id === agentId)
      if (agentTemplate) {
        setSelectedAgentTemplate(agentTemplate)
        setShowAddAgentDialog(true)
      }
    },
    [agents]
  )

  const handleSaveAgent = async () => {
    try {
      await refreshCustomAgents()
      setShowAddAgentDialog(false)
      setSelectedAgentTemplate(null)
    } finally {
      setShowAddAgentDialog(false)
      setSelectedAgentTemplate(null)
    }
  }

  const handleCloseDialog = () => {
    setShowAddAgentDialog(false)
    setSelectedAgentTemplate(null)
  }

  const handleAddNewAgent = useCallback(() => {
    setSelectedCustomAgent(createEmptyAgent())
    setShowConfigPanel(true)
  }, [])

  const handleConfigure = useCallback(
    (agent: CustomAgent) => {
      const cleanAgent = cleanAgentForConfig(agent, i18n.language)
      setSelectedCustomAgent(cleanAgent)
      setShowConfigPanel(true)
    },
    [i18n.language]
  )

  const handleConfigSave = async (updatedAgent: CustomAgent) => {
    try {
      await refreshCustomAgents()
      setShowConfigPanel(false)
      setSelectedCustomAgent(null)
    } catch (error) {
      console.error(error)
      const cleanAgent = cleanAgentForConfig(updatedAgent, i18n.language)
      setCustomAgents((prev: CustomAgent[]) =>
        prev.map((a: CustomAgent) => (a.id === cleanAgent.id ? cleanAgent : a))
      )
      setShowConfigPanel(false)
      setSelectedCustomAgent(null)
    }
  }

  const handleConfigClose = useCallback(() => {
    setShowConfigPanel(false)
    setSelectedCustomAgent(null)
  }, [])

  const handleImportSuccess = useCallback(async () => {
    await refreshCustomAgents()
  }, [refreshCustomAgents])

  return (
    <BasePage
      loading={loading || customAgentsLoading}
      error={
        error && customAgentsError
          ? `${error} | ${customAgentsError}`
          : error || customAgentsError
      }
      title={t('custom_ai_agents', 'Agentic AI')}
      addButtonLabel={t('add_new_agent', 'ADD NEW AGENT')}
      onAdd={handleAddNewAgent}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_agent', 'Delete Agent')}
      deleteConfirmMessage={t(
        'delete_agent_confirmation',
        'Are you sure you want to delete this agent? This action cannot be undone.'
      )}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="agents"
    >
      {/* My Agents Section */}
      <div className="my-agents-section">
        <div className="section-title-with-actions">
          <h2 className="section-title">{t('my_agents', 'My Agents')}</h2>
          <button
            className="import-action-button"
            onClick={() => setShowImportDialog(true)}
            title={t('import_agent', 'Import Agent')}
            aria-label={t('import_agent', 'Import Agent')}
          >
            <i className="pi pi-download"></i>
          </button>
        </div>

        {customAgentsError ? (
          <Message severity="error" text={customAgentsError} />
        ) : customAgents.filter((agent) => !agent.handOff).length > 0 ? (
          <div className="agents-grid">
            {customAgents
              .filter((agent) => !agent.handOff)
              .map((agent) => (
                <CustomAgentCard
                  key={agent.id}
                  agent={agent}
                  appState={appState}
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
          <h2 className="section-title">
            {t('predefined_agents', 'Predefined Agents')}
          </h2>
          <p className="section-description">
            {t(
              'predefined_agents_description',
              'We have number of available Agents in our system. Add any to your list, rename it, to make the desired achievement.'
            )}
          </p>
        </div>

        {error ? (
          <Message severity="error" text={error} />
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
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

      <ImportAgentDialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        onImport={handleImportSuccess}
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
    </BasePage>
  )
})

AgentsView.displayName = 'AgentsView'

export default AgentsView
