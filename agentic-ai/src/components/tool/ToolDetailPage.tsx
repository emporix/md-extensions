import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tool } from '../../types/Tool'
import { AppState } from '../../types/common'
import { getTools } from '../../services/toolsService'
import { createEmptyTool } from '../../utils/toolHelpers'
import { useToolConfig } from '../../hooks/useToolConfig'
import { ToolGeneralSection } from './ToolGeneralSection'
import { ToolDetailSection } from './ToolDetailSection'
import { DetailStatusDot } from '../shared/DetailStatusDot'
import { SlackToolSection } from './SlackToolSection'
import { SlackInstallSection } from './SlackInstallSection'
import { RagCustomResultsSection } from './RagCustomResultsSection'
import { RagCustomDatabaseSection } from './RagCustomDatabaseSection'
import { RagCustomEmbeddingSection } from './RagCustomEmbeddingSection'
import { RagEmporixToolSection } from './RagEmporixToolSection'
import { RagEmporixIndexedFieldsSection } from './RagEmporixIndexedFieldsSection'
import { RagFilterFieldsSection } from './RagFilterFieldsSection'

interface ToolDetailPageProps {
  appState: AppState
}

type ToolDetailTab = 'general' | 'settings'

const TABS: Array<{ key: ToolDetailTab; labelKey: string }> = [
  { key: 'general', labelKey: 'general' },
  { key: 'settings', labelKey: 'settings' },
]

const ToolDetailPage: React.FC<ToolDetailPageProps> = ({ appState }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { toolId } = useParams<{ toolId: string }>()
  const isCreating = location.pathname.endsWith('/add')

  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ToolDetailTab>('general')

  useEffect(() => {
    if (isCreating) {
      setTool(createEmptyTool())
      setError(null)
      setLoading(false)
      return
    }

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
        const tools = await getTools(appState)
        if (cancelled) return

        const foundTool = tools.find((item) => item.id === toolId)
        if (!foundTool) {
          setError(t('tool_not_found'))
          setTool(null)
          return
        }

        setTool(foundTool)
      } catch {
        if (!cancelled) {
          setError(t('error_loading_tool'))
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

  const handleSaveSuccess = useCallback(() => {
    navigate('/tools')
  }, [navigate])

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
  } = useToolConfig({
    tool,
    isCreating,
    appState,
    onSave: handleSaveSuccess,
  })

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
          <SlackToolSection
            config={state.config}
            isCreating={isCreating}
            onConfigChange={updateConfig}
          />
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
    if (activeTab === 'general') {
      return (
        <div className="tool-detail-tab-panel">
          <ToolDetailSection titleKey="general">
            <ToolGeneralSection
              toolId={state.toolId}
              toolName={state.toolName}
              toolType={state.toolType}
              prompt={state.config.prompt ?? ''}
              showPrompt={showPrompt}
              isEditing={isEditing}
              onFieldChange={updateField}
              onToolTypeChange={(value) => updateField('toolType', value)}
              onPromptChange={(value) => updateConfig('prompt', value)}
            />
          </ToolDetailSection>

          {state.toolType === 'slack' && isCreating && (
            <ToolDetailSection titleKey="install_slack">
              <SlackInstallSection appState={appState} />
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
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tool-detail-tab${activeTab === tab.key ? ' tool-detail-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="tool-detail-content">{renderTabContent()}</div>
    </div>
  )
}

export default ToolDetailPage
