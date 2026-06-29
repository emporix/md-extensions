import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { DetailStatusDot } from '../shared/DetailStatusDot'
import {
  CustomAgent,
  LocalizedString,
  McpServer,
  NativeTool,
  AgentCollaboration,
} from '../../types/Agent'
import { useAppState } from '../../contexts/AppStateContext'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { AgentBasicInfo } from './agent-config/AgentBasicInfo'
import { TriggersSection } from './agent-config/TriggersSection'
import { ToolsSection } from './agent-config/ToolsSection'
import { ModelSection } from './agent-config/ModelSection'
import { CollaborationSection } from './agent-config/CollaborationSection'
import { useAgentConfig } from '../../hooks/useAgentConfig'
import { useAgentToolsCatalog } from '../../hooks/useAgentToolsCatalog'
import { useAgentTokensCatalog } from '../../hooks/useAgentTokensCatalog'
import { useLlmModelsCatalog } from '../../hooks/useLlmModelsCatalog'
import { useCommerceEvents } from '../../hooks/useCommerceEvents'
import {
  cleanAgentForConfig,
  createEmptyAgent,
  getLocalizedValue,
} from '../../utils/agentHelpers'
import { getCustomAgents } from '../../services/agentService'
import type { AgentCommerceFilterDsl } from '../../utils/agentFilterDslHelpers'

const TABS = [
  { key: 'general', labelKey: 'general' },
  { key: 'model', labelKey: 'model' },
  { key: 'triggers', labelKey: 'triggers_and_constraints' },
  { key: 'tools', labelKey: 'tools' },
  { key: 'collaboration', labelKey: 'collaboration' },
] as const

type AgentDetailTab = (typeof TABS)[number]['key']

const AgentDetailPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { agentId } = useParams<{ agentId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [agent, setAgent] = useState<CustomAgent | null>(null)
  const [availableAgents, setAvailableAgents] = useState<CustomAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AgentDetailTab>('general')

  useEffect(() => {
    if (isCreating) {
      setAgent(createEmptyAgent(appState.contentLanguage))
      setError(null)
      setLoading(true)

      let cancelled = false

      ;(async () => {
        try {
          const agents = await getCustomAgents(appState)
          if (!cancelled) {
            setAvailableAgents(agents)
          }
        } catch {
          if (!cancelled) {
            setAvailableAgents([])
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      })()

      return () => {
        cancelled = true
      }
    }

    if (!agentId) {
      setError(t('agent_not_found'))
      setAgent(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const agents = await getCustomAgents(appState)
        if (cancelled) return

        setAvailableAgents(agents)

        const foundAgent = agents.find((item) => item.id === agentId)
        if (!foundAgent) {
          setError(t('agent_not_found'))
          setAgent(null)
          return
        }

        setAgent(cleanAgentForConfig(foundAgent))
      } catch {
        if (!cancelled) {
          setError(t('error_loading_agent'))
          setAgent(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [agentId, appState, isCreating, t])

  const {
    tools: catalogTools,
    mcpServers: catalogMcpServers,
    toolsLoading,
    mcpServersLoading,
  } = useAgentToolsCatalog()

  const { tokens: catalogTokens, loading: tokensLoading } =
    useAgentTokensCatalog()

  const {
    modelsByProvider,
    loading: modelsLoading,
    error: modelsError,
    hasFetched: modelsFetched,
  } = useLlmModelsCatalog()

  const {
    events: commerceEventCatalog,
    loading: commerceCatalogLoading,
    error: commerceCatalogError,
  } = useCommerceEvents()

  const handleNavigateBack = useCallback(() => {
    navigate('/agents')
  }, [navigate])

  const handleSaveSuccess = useCallback(() => {
    navigate('/agents')
  }, [navigate])

  const {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid,
    showDisableConfirm,
    disableConfirmMessage,
    handleConfirmDisable,
    handleCancelDisable,
  } = useAgentConfig({
    agent,
    onSave: handleSaveSuccess,
    onHide: handleNavigateBack,
  })

  const agentDisplayName = useMemo(() => {
    const localizedName = getLocalizedValue(
      state.agentName,
      appState.contentLanguage
    )
    if (localizedName.trim()) {
      return localizedName
    }
    return isCreating ? t('new_agent') : state.agentId || t('new_agent')
  }, [state.agentName, state.agentId, appState.contentLanguage, isCreating, t])

  const handleFieldChange = (
    field: string,
    value:
      | string
      | boolean
      | string[]
      | LocalizedString
      | AgentCommerceFilterDsl
      | McpServer[]
      | NativeTool[]
      | AgentCollaboration[]
      | null
  ) => {
    updateField(field, value)
  }

  const renderTabContent = () => {
    if (activeTab === 'general') {
      return (
        <div className="agent-detail-tab-panel">
          <h2 className="agent-detail-section-title">{t('general')}</h2>
          <section className="agent-detail-section">
            <AgentBasicInfo
              agentId={state.agentId}
              agentName={state.agentName}
              description={state.description}
              prompt={state.prompt}
              outputFormat={state.outputFormat}
              tags={state.tags}
              selectedIcon={state.selectedIcon}
              templatePrompt={state.templatePrompt}
              isEditing={!isCreating && !!agent?.id}
              onFieldChange={handleFieldChange}
            />
          </section>
        </div>
      )
    }

    if (activeTab === 'triggers') {
      return (
        <TriggersSection
          agentType={state.agentType}
          triggerTypes={state.triggerTypes}
          commerceEvents={state.commerceEvents}
          commerceEventFilter={state.commerceEventFilter}
          requiredScopes={state.requiredScopes}
          onFieldChange={handleFieldChange}
          commerceEventCatalog={commerceEventCatalog}
          commerceCatalogLoading={commerceCatalogLoading}
          commerceCatalogError={commerceCatalogError}
        />
      )
    }

    if (activeTab === 'tools') {
      return (
        <ToolsSection
          mcpServers={state.mcpServers}
          nativeTools={state.nativeTools}
          availableTools={catalogTools}
          availableMcpServers={catalogMcpServers}
          toolsLoading={toolsLoading}
          mcpServersLoading={mcpServersLoading}
          onFieldChange={handleFieldChange}
        />
      )
    }

    if (activeTab === 'model') {
      return (
        <ModelSection
          provider={state.provider}
          model={state.model}
          temperature={state.temperature}
          maxTokens={state.maxTokens}
          tokenId={state.tokenId}
          recursionLimit={state.recursionLimit}
          enableMemory={state.enableMemory}
          selfHostedUrl={state.selfHostedUrl}
          selfHostedAuthHeaderName={state.selfHostedAuthHeaderName}
          selfHostedTokenId={state.selfHostedTokenId}
          modelsByProvider={modelsByProvider}
          modelsLoading={modelsLoading}
          modelsFetched={modelsFetched}
          modelsError={modelsError}
          tokens={catalogTokens}
          tokensLoading={tokensLoading}
          isCreateMode={isCreating}
          onFieldChange={handleFieldChange}
        />
      )
    }

    if (activeTab === 'collaboration') {
      return (
        <CollaborationSection
          collaborations={state.agentCollaborations}
          onChange={(collaborations) =>
            updateField('agentCollaborations', collaborations)
          }
          availableAgents={availableAgents}
          currentAgentId={state.agentId || agent?.id}
          currentAgentType={state.agentType}
        />
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="agent-detail-page">
        <div className="agent-detail-loading">
          <ProgressSpinner />
          <p>{t('loading_agents')}</p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="agent-detail-page">
        <div className="agent-detail-sticky-header">
          <div className="agent-detail-header">
            <div className="agent-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_agents')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <span className="agent-detail-title-label">{t('agent')}</span>
            </div>
          </div>
        </div>
        <Message
          severity="error"
          text={error ?? t('agent_not_found')}
          className="agent-detail-error-message"
        />
      </div>
    )
  }

  return (
    <div className="agent-detail-page">
      <div className="agent-detail-sticky-header">
        <div className="agent-detail-header">
          <div className="agent-detail-header-main">
            <div className="agent-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_agents')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <h1 className="agent-detail-title">
                <span className="agent-detail-title-text">
                  <span className="agent-detail-title-prefix">
                    {t('agent')}{' '}
                  </span>
                  <span className="agent-detail-title-name">
                    {agentDisplayName}
                  </span>
                </span>
                <DetailStatusDot enabled={agent.enabled ?? true} />
              </h1>
            </div>
            <p className="agent-detail-subtitle">
              {t('agent_config_panel_subtitle')}
            </p>
          </div>
          <div className="agent-detail-header-right">
            <Button
              type="button"
              label={t('save')}
              className="agent-detail-save-btn"
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
            />
          </div>
        </div>

        <div className="agent-detail-tab-bar-row">
          <nav className="agent-detail-tab-bar" aria-label={t('agent_tabs')}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`agent-detail-tab${activeTab === tab.key ? ' agent-detail-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="agent-detail-content">{renderTabContent()}</div>

      <ConfirmDialog
        visible={showDisableConfirm}
        title={t('confirm_save_agent')}
        message={t('confirm_disable_agent_message', {
          detail: disableConfirmMessage,
        })}
        confirmLabel={t('save_and_deactivate')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmDisable}
        onHide={handleCancelDisable}
        severity="warning"
      />
    </div>
  )
}

export default AgentDetailPage
