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
import { ConversationsTab } from '../shared/ConversationsTab'
import { useAgentConfig } from '../../hooks/useAgentConfig'
import { useFeatureToggles } from '../../hooks/useFeatureToggles'
import { useAgentToolsCatalog } from '../../hooks/useAgentToolsCatalog'
import { useAgentTokensCatalog } from '../../hooks/useAgentTokensCatalog'
import { useAgentOAuthCatalog } from '../../hooks/useAgentOAuthCatalog'
import { useLlmModelsCatalog } from '../../hooks/useLlmModelsCatalog'
import { useCommerceEvents } from '../../hooks/useCommerceEvents'
import {
  cleanAgentForConfig,
  createEmptyAgent,
  getLocalizedValue,
} from '../../utils/agentHelpers'
import { getCustomAgent, getCustomAgents } from '../../services/agentService'
import { getEntityLoadErrorMessage } from '../../utils/errorHelpers'
import { hasConversations } from '../../services/conversationsService'
import type { AgentCommerceFilterDsl } from '../../utils/agentFilterDslHelpers'

const BASE_TABS = [
  { key: 'general', labelKey: 'general' },
  { key: 'model', labelKey: 'model' },
  { key: 'triggers', labelKey: 'triggers_and_constraints' },
  { key: 'tools', labelKey: 'tools' },
  { key: 'collaboration', labelKey: 'collaboration' },
] as const

type AgentDetailTab = (typeof BASE_TABS)[number]['key'] | 'conversations'

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
  const [showConversationsTab, setShowConversationsTab] = useState(false)

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
        const [fetchedAgent, agents] = await Promise.all([
          getCustomAgent(appState, agentId),
          getCustomAgents(appState),
        ])
        if (cancelled) return

        setAvailableAgents(agents)
        setAgent(cleanAgentForConfig(fetchedAgent))
      } catch (err) {
        if (!cancelled) {
          setError(
            getEntityLoadErrorMessage(
              err,
              {
                notFoundKey: 'agent_not_found',
                errorKey: 'error_loading_agent',
              },
              t
            )
          )
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

  useEffect(() => {
    if (!appState || isCreating || !agentId?.trim()) {
      setShowConversationsTab(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const exists = await hasConversations(appState, { agentId })
        if (!cancelled) {
          setShowConversationsTab(exists)
        }
      } catch {
        if (!cancelled) {
          setShowConversationsTab(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [agentId, appState, isCreating])

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ key: AgentDetailTab; labelKey: string }> = [
      ...BASE_TABS,
    ]
    if (showConversationsTab) {
      tabs.push({ key: 'conversations', labelKey: 'conversations' })
    }
    return tabs
  }, [showConversationsTab])

  useEffect(() => {
    if (
      activeTab === 'conversations' &&
      !visibleTabs.some((tab) => tab.key === 'conversations')
    ) {
      setActiveTab('general')
    }
  }, [activeTab, visibleTabs])

  const {
    tools: catalogTools,
    mcpServers: catalogMcpServers,
    toolsLoading,
    mcpServersLoading,
  } = useAgentToolsCatalog()

  const { tokens: catalogTokens, loading: tokensLoading } =
    useAgentTokensCatalog()

  const { oauths: catalogOAuths, loading: oauthsLoading } =
    useAgentOAuthCatalog()

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

  const { toggles } = useFeatureToggles()

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
    availableTools: catalogTools,
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
          triggerTypes={state.triggerTypes}
          commerceEvents={state.commerceEvents}
          commerceEventFilter={state.commerceEventFilter}
          requiredScopes={state.requiredScopes}
          onFieldChange={handleFieldChange}
          commerceEventCatalog={commerceEventCatalog}
          commerceCatalogLoading={commerceCatalogLoading}
          commerceCatalogError={commerceCatalogError}
          msTeamsEnabled={toggles.msTeams}
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
          disableTemperature={state.disableTemperature}
          maxTokens={state.maxTokens}
          tokenId={state.tokenId}
          recursionLimit={state.recursionLimit}
          enableMemory={state.enableMemory}
          selfHostedUrl={state.selfHostedUrl}
          baseProvider={state.baseProvider}
          selfHostedUseOAuth={state.selfHostedUseOAuth}
          selfHostedAuthHeaderName={state.selfHostedAuthHeaderName}
          selfHostedTokenId={state.selfHostedTokenId}
          oauthId={state.oauthId}
          fileProcessingUseResponsesApi={state.fileProcessingUseResponsesApi}
          fileProcessingExtraModelKey={state.fileProcessingExtraModelKey}
          modelsByProvider={modelsByProvider}
          modelsLoading={modelsLoading}
          modelsFetched={modelsFetched}
          modelsError={modelsError}
          tokens={catalogTokens}
          tokensLoading={tokensLoading}
          oauths={catalogOAuths}
          oauthsLoading={oauthsLoading}
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
        />
      )
    }

    if (activeTab === 'conversations') {
      return (
        <div className="agent-detail-tab-panel">
          <h2 className="agent-detail-section-title">{t('conversations')}</h2>
          <p className="tool-detail-section-description">
            {t('conversations_tab_hint')}
          </p>
          <ConversationsTab
            agents={availableAgents}
            agentId={state.agentId}
            enabled={!isCreating && !!agentId?.trim()}
          />
        </div>
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
            {visibleTabs.map((tab) => (
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
        message={t('confirm_disable_agent_message')}
        detail={disableConfirmMessage}
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
