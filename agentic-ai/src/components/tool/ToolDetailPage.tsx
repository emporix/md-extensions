import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tool } from '../../types/Tool'
import { useAppState } from '../../contexts/AppStateContext'
import { getTool, getTools } from '../../services/toolsService'
import { getEntityLoadErrorMessage } from '../../utils/errorHelpers'
import { getCustomAgents } from '../../services/agentService'
import { hasConversations } from '../../services/conversationsService'
import { CustomAgent } from '../../types/Agent'
import {
  createEmptyTool,
  createEmptyTeamsTool,
  applyTeamsGraphConsentToTool,
  shouldApplyTeamsGraphConsent,
} from '../../utils/toolHelpers'
import { countTeamsToolsForTeam } from '../../utils/teamsRoutingHelpers'
import { countSlackToolsForTeam } from '../../utils/slackRoutingHelpers'
import { isCommunicationNativeToolType } from '../../utils/communicationRoutingHelpers'
import { useToolConfig } from '../../hooks/useToolConfig'
import { useFeatureToggles } from '../../hooks/useFeatureToggles'
import { ToolGeneralSection } from './ToolGeneralSection'
import { ToolRequiredMark } from './ToolRequiredMark'
import { ToolDetailSection } from './ToolDetailSection'
import { DetailStatusDot } from '../shared/DetailStatusDot'
import { SlackToolSection } from './SlackToolSection'
import { SlackInstallSection } from './SlackInstallSection'
import { TeamsToolSection } from './TeamsToolSection'
import { TeamsInstallSection } from './TeamsInstallSection'
import { RagCustomResultsSection } from './RagCustomResultsSection'
import { RagCustomDatabaseSection } from './RagCustomDatabaseSection'
import { RagCustomEmbeddingSection } from './RagCustomEmbeddingSection'
import { RagEmporixToolSection } from './RagEmporixToolSection'
import { RagEmporixIndexedFieldsSection } from './RagEmporixIndexedFieldsSection'
import { RagFilterFieldsSection } from './RagFilterFieldsSection'
import { useToast } from '../../contexts/ToastContext'
import { TeamsGraphConsentCallback } from '../../utils/teamsInstallCallback'
import { ConversationsTab } from '../shared/ConversationsTab'

type ToolDetailTab = 'general' | 'settings' | 'conversations'

const BASE_TABS: Array<{
  key: Exclude<ToolDetailTab, 'conversations'>
  labelKey: string
}> = [
  { key: 'general', labelKey: 'general' },
  { key: 'settings', labelKey: 'settings' },
]

const ToolDetailPage: React.FC = () => {
  const appState = useAppState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const { toolId } = useParams<{ toolId: string }>()
  const isCreating = location.pathname.endsWith('/add')
  const teamsConsentHandledRef = useRef(false)
  const createToolSeededRef = useRef(false)

  const [tool, setTool] = useState<Tool | null>(null)
  const [availableAgents, setAvailableAgents] = useState<CustomAgent[]>([])
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ToolDetailTab>('general')
  const [showConversationsTab, setShowConversationsTab] = useState(false)

  useEffect(() => {
    if (isCreating) {
      if (!createToolSeededRef.current) {
        createToolSeededRef.current = true
        const consentStatus = searchParams.get('teamsGraphConsent')
        const providerTenantId =
          searchParams.get('providerTenantId')?.trim() || undefined
        if (consentStatus) {
          setTool(
            createEmptyTeamsTool(
              consentStatus === 'success' ? providerTenantId : undefined
            )
          )
        } else {
          setTool(createEmptyTool())
        }
      }
      setError(null)
      setLoading(false)
      return
    }

    createToolSeededRef.current = false

    if (!toolId) {
      setError(t('tool_not_found'))
      setTool(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedTool = await getTool(appState, toolId)
        if (cancelled) return

        setTool(fetchedTool)
      } catch (err) {
        if (!cancelled) {
          setError(
            getEntityLoadErrorMessage(
              err,
              { notFoundKey: 'tool_not_found', errorKey: 'error_loading_tool' },
              t
            )
          )
          setTool(null)
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
  }, [appState, isCreating, t, toolId])

  const handleNavigateBack = useCallback(() => {
    navigate('/tools')
  }, [navigate])

  const handleSaveSuccess = useCallback(
    (savedToolId?: string, savedToolType?: string) => {
      if (isCreating && savedToolType === 'teams' && savedToolId?.trim()) {
        navigate(`/tools/${savedToolId.trim()}/edit`, { replace: true })
        return
      }
      navigate('/tools')
    },
    [isCreating, navigate]
  )

  const {
    state,
    saving,
    availableTokens,
    availableFields,
    availableFilterFields,
    customSchemaTypesLoading,
    ragEmporixEntityTypeOptions,
    updateField,
    updateConfig,
    updateAllowedOperations,
    updateRagEmporixEntityType,
    updateNestedConfig,
    updateDeeplyNestedConfig,
    updateEmbeddingDimensions,
    addIndexedField,
    addCustomIndexedField,
    removeIndexedField,
    updateIndexedField,
    addFilterField,
    removeFilterField,
    updateFilterField,
    selectFilterFieldKey,
    handleSave,
    isFormValid,
    applyTeamsGraphConsent,
    restoreTeamsInstallDraft,
    loadTeamsInstallDraft,
  } = useToolConfig({
    tool,
    isCreating,
    onSave: handleSaveSuccess,
    onAgentsUpdated: setAvailableAgents,
  })

  const { toggles, loading: togglesLoading } = useFeatureToggles()

  useEffect(() => {
    if (teamsConsentHandledRef.current) {
      return
    }

    const consentStatus = searchParams.get('teamsGraphConsent')
    if (!consentStatus) {
      return
    }

    if (!isCreating && loading) {
      return
    }

    teamsConsentHandledRef.current = true

    const callback: TeamsGraphConsentCallback = {
      status:
        consentStatus === 'success' || consentStatus === 'error'
          ? consentStatus
          : 'unknown',
      providerTenantId: searchParams.get('providerTenantId') ?? undefined,
      state: searchParams.get('state') ?? undefined,
      error: searchParams.get('error') ?? undefined,
      errorDescription: searchParams.get('errorDescription') ?? undefined,
    }

    const draft = loadTeamsInstallDraft(callback.state)
    if (draft && (isCreating || location.pathname.endsWith('/add'))) {
      restoreTeamsInstallDraft(draft)
    }

    const isTeamsConsentTarget = shouldApplyTeamsGraphConsent({
      isCreating,
      toolType: tool?.type,
      draftToolType: draft?.toolType,
    })

    if (callback.status === 'success') {
      if (isTeamsConsentTarget) {
        applyTeamsGraphConsent(callback)
        setActiveTab('general')
        setTool((prev) => applyTeamsGraphConsentToTool(prev, callback, draft))
        showSuccess(t('teams_graph_consent_success'))
      }
    } else if (callback.status === 'error') {
      applyTeamsGraphConsent(callback)
      showError(
        callback.errorDescription?.trim()
          ? `${t('teams_graph_consent_error')}: ${callback.errorDescription}`
          : t('teams_graph_consent_error')
      )
    } else {
      showError(t('teams_graph_consent_unknown'))
    }

    setSearchParams({}, { replace: true })
  }, [
    applyTeamsGraphConsent,
    isCreating,
    loadTeamsInstallDraft,
    loading,
    location.pathname,
    restoreTeamsInstallDraft,
    searchParams,
    tool?.type,
    setSearchParams,
    showError,
    showSuccess,
    t,
  ])

  useEffect(() => {
    if (!isCommunicationNativeToolType(state.toolType) || !appState) {
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const [agents, tools] = await Promise.all([
          getCustomAgents(appState),
          getTools(appState),
        ])
        if (!cancelled) {
          setAvailableAgents(agents)
          setAllTools(tools)
        }
      } catch {
        if (!cancelled) {
          setAvailableAgents([])
          setAllTools([])
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [appState, state.toolType])

  useEffect(() => {
    if (
      !isCommunicationNativeToolType(state.toolType) ||
      !appState ||
      !state.toolId.trim() ||
      isCreating
    ) {
      setShowConversationsTab(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const exists = await hasConversations(appState, {
          toolId: state.toolId,
        })
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
  }, [appState, isCreating, state.toolId, state.toolType])

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ key: ToolDetailTab; labelKey: string }> = [...BASE_TABS]
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

  const settingsLocked = isCreating && !state.toolType

  useEffect(() => {
    if (settingsLocked && activeTab === 'settings') {
      setActiveTab('general')
    }
  }, [activeTab, settingsLocked])

  const teamConfigConflict =
    state.toolType === 'teams' &&
    !!state.config.teamId?.trim() &&
    !!state.config.tenantId?.trim() &&
    countTeamsToolsForTeam(
      allTools,
      state.config.teamId,
      state.config.tenantId,
      state.toolId
    ) > 0

  const slackTeamConfigConflict =
    state.toolType === 'slack' &&
    !!state.config.teamId?.trim() &&
    countSlackToolsForTeam(allTools, state.config.teamId, state.toolId) > 0

  const isEditing = !isCreating && !!tool?.id
  const showPrompt =
    state.toolType === 'rag_custom' || state.toolType === 'rag_emporix'

  const toolDisplayName = useMemo(() => {
    if (state.toolName.trim()) {
      return state.toolName
    }
    return isCreating ? t('new_tool') : state.toolId || t('new_tool')
  }, [isCreating, state.toolId, state.toolName, t])

  const renderSettingsSection = () => {
    switch (state.toolType) {
      case 'slack':
        return (
          <>
            {slackTeamConfigConflict ? (
              <div className="form-field">
                <Message
                  severity="error"
                  className="w-full"
                  text={t('slack_team_config_conflict')}
                />
              </div>
            ) : null}
            <SlackToolSection
              config={state.config}
              availableAgents={availableAgents}
              isCreating={isCreating}
              isEditing={isEditing}
              onConfigChange={updateConfig}
              onAllowedOperationsChange={updateAllowedOperations}
            />
          </>
        )
      case 'teams':
        return (
          <>
            {teamConfigConflict ? (
              <div className="form-field">
                <Message
                  severity="error"
                  className="w-full"
                  text={t('teams_team_config_conflict')}
                />
              </div>
            ) : null}
            <TeamsToolSection
              config={state.config}
              availableAgents={availableAgents}
              isEditing={isEditing}
              onConfigChange={updateConfig}
              onAllowedOperationsChange={updateAllowedOperations}
            />
          </>
        )
      case 'rag_emporix':
        return (
          <RagEmporixToolSection
            config={state.config}
            isEditing={isEditing}
            availableTokens={availableTokens}
            entityTypeOptions={ragEmporixEntityTypeOptions}
            entityTypesLoading={customSchemaTypesLoading}
            onEntityTypeChange={updateRagEmporixEntityType}
            onNestedConfigChange={updateNestedConfig}
            onDeeplyNestedConfigChange={updateDeeplyNestedConfig}
            onEmbeddingDimensionsChange={updateEmbeddingDimensions}
          />
        )
      default:
        return state.toolType ? (
          <div className="form-field">
            <label className="field-label">{t('configuration')}</label>
            <pre className="config-json">
              {JSON.stringify(state.config, null, 2)}
            </pre>
          </div>
        ) : null
    }
  }

  const renderTabContent = () => {
    if (activeTab === 'conversations') {
      return (
        <div className="tool-detail-tab-panel">
          <ToolDetailSection titleKey="conversations">
            <p className="tool-detail-section-description">
              {t('conversations_tab_hint')}
            </p>
            <ConversationsTab
              agents={availableAgents}
              toolId={state.toolId}
              enabled={
                isCommunicationNativeToolType(state.toolType) &&
                !isCreating &&
                !!state.toolId.trim()
              }
            />
          </ToolDetailSection>
        </div>
      )
    }

    if (activeTab === 'general') {
      return (
        <div className="tool-detail-tab-panel">
          <ToolDetailSection titleKey="general">
            <ToolGeneralSection
              toolId={state.toolId}
              toolName={state.toolName}
              toolType={state.toolType}
              isEditing={isEditing}
              msTeamsEnabled={toggles.msTeams}
              optionsReady={!togglesLoading}
              onFieldChange={updateField}
              onToolTypeChange={(value) => updateField('toolType', value)}
            />
          </ToolDetailSection>

          {showPrompt && (
            <ToolDetailSection titleKey="prompt">
              <div className="form-field">
                <label className="field-label">
                  {t('prompt')}
                  <ToolRequiredMark />
                </label>
                <InputTextarea
                  value={state.config.prompt ?? ''}
                  onChange={(event) =>
                    updateConfig('prompt', event.target.value)
                  }
                  className={`w-full${!(state.config.prompt ?? '').trim() ? ' p-invalid' : ''}`}
                  placeholder={t('enter_prompt')}
                  rows={3}
                />
              </div>
            </ToolDetailSection>
          )}

          {state.toolType === 'slack' && isCreating && (
            <ToolDetailSection titleKey="install_slack">
              <SlackInstallSection />
            </ToolDetailSection>
          )}

          {state.toolType === 'teams' &&
            (isCreating || !state.config.teamId?.trim()) && (
              <ToolDetailSection titleKey="install_teams">
                <TeamsInstallSection
                  providerTenantId={state.config.tenantId ?? ''}
                  toolId={state.toolId}
                  toolName={state.toolName}
                  toolType={state.toolType}
                  toolPersisted={isEditing}
                  onProviderTenantIdChange={(value) =>
                    updateConfig('tenantId', value)
                  }
                  onInstallReady={(readyToolId) => {
                    navigate(`/tools/${readyToolId}/edit`, { replace: true })
                  }}
                />
              </ToolDetailSection>
            )}
        </div>
      )
    }

    return (
      <div className="tool-detail-tab-panel">
        {state.toolType === 'rag_emporix' ? (
          <>
            <ToolDetailSection titleKey="embedding_configuration">
              {renderSettingsSection()}
            </ToolDetailSection>
            <ToolDetailSection titleKey="indexed_fields">
              <RagEmporixIndexedFieldsSection
                config={state.config}
                availableFields={availableFields}
                onAddIndexedField={addIndexedField}
                onAddCustomIndexedField={addCustomIndexedField}
                onRemoveIndexedField={removeIndexedField}
                onUpdateIndexedField={updateIndexedField}
              />
            </ToolDetailSection>
            <ToolDetailSection titleKey="filter_fields">
              <RagFilterFieldsSection
                filterFields={state.config.filterFields ?? []}
                availableFilterFields={availableFilterFields}
                onAdd={addFilterField}
                onRemove={removeFilterField}
                onUpdateField={updateFilterField}
                onSelectKey={selectFilterFieldKey}
              />
            </ToolDetailSection>
          </>
        ) : state.toolType === 'rag_custom' ? (
          <>
            <ToolDetailSection titleKey="results">
              <RagCustomResultsSection
                config={state.config}
                onConfigChange={updateConfig}
              />
            </ToolDetailSection>
            <ToolDetailSection titleKey="database_configuration">
              <RagCustomDatabaseSection
                config={state.config}
                availableTokens={availableTokens}
                onNestedConfigChange={updateNestedConfig}
                onDeeplyNestedConfigChange={updateDeeplyNestedConfig}
              />
            </ToolDetailSection>
            <ToolDetailSection titleKey="embedding_configuration">
              <RagCustomEmbeddingSection
                config={state.config}
                availableTokens={availableTokens}
                onNestedConfigChange={updateNestedConfig}
                onDeeplyNestedConfigChange={updateDeeplyNestedConfig}
              />
            </ToolDetailSection>
          </>
        ) : (
          <ToolDetailSection titleKey="settings">
            {renderSettingsSection()}
          </ToolDetailSection>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="tool-detail-page">
        <div className="tool-detail-loading">
          <ProgressSpinner />
          <p>{t('loading_tools')}</p>
        </div>
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="tool-detail-page">
        <div className="tool-detail-sticky-header">
          <div className="tool-detail-header">
            <div className="tool-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_tools')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <span className="tool-detail-title-label">{t('tools')}</span>
            </div>
          </div>
        </div>
        <Message
          severity="error"
          text={error ?? t('tool_not_found')}
          className="tool-detail-error-message"
        />
      </div>
    )
  }

  return (
    <div className="tool-detail-page">
      <div className="tool-detail-sticky-header">
        <div className="tool-detail-header">
          <div className="tool-detail-header-main">
            <div className="tool-detail-header-left">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="details-back-button"
                aria-label={t('back_to_tools')}
              >
                <i className="pi pi-arrow-left" />
              </button>
              <h1 className="tool-detail-title">
                <span className="tool-detail-title-text">
                  <span className="tool-detail-title-prefix">
                    {t('tools')}{' '}
                  </span>
                  <span className="tool-detail-title-name">
                    {toolDisplayName}
                  </span>
                </span>
                <DetailStatusDot enabled={tool.enabled ?? true} />
              </h1>
            </div>
            <p className="tool-detail-subtitle">{t('tool_detail_subtitle')}</p>
          </div>
          <div className="tool-detail-header-right">
            <Button
              type="button"
              label={t('save')}
              className="tool-detail-save-btn"
              onClick={() => handleSave()}
              disabled={saving || !isFormValid}
              loading={saving}
            />
          </div>
        </div>

        <div className="tool-detail-tab-bar-row">
          <nav className="tool-detail-tab-bar" aria-label={t('tool_tabs')}>
            {visibleTabs.map((tab) => {
              const isSettingsTab = tab.key === 'settings'
              const isTabDisabled = isSettingsTab && settingsLocked

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`tool-detail-tab${activeTab === tab.key ? ' tool-detail-tab-active' : ''}${isTabDisabled ? ' tool-detail-tab-disabled' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={isTabDisabled}
                >
                  {t(tab.labelKey)}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="tool-detail-content">{renderTabContent()}</div>
    </div>
  )
}

export default ToolDetailPage
