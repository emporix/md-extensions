import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import {
  RagCustomDatabase,
  RagEmporixFieldConfig,
  RagEmporixFilterFieldConfig,
  RagEntityType,
  RagLlmProvider,
  RagEmporixEmbeddingConfig,
  Tool,
  ToolConfig,
  ToolConfigPanelProps,
} from '../../types/Tool'
import {
  getTokens,
  getSlackInstallationData,
} from '../../services/toolsService'
import { useToast } from '../../contexts/ToastContext'
import { BaseConfigPanel } from '../shared/BaseConfigPanel'
import { faTools } from '@fortawesome/free-solid-svg-icons'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import {
  getRagFilterMetadata,
  getRagMetadata,
  RagFilterMetadataField,
} from '../../services/aiRagIndexerService'
import { sanitizeIdInput } from '../../utils/validation'
import {
  areRagEmporixFilterFieldsValid,
  createEmptyFilterField,
  isValidRagFieldKey,
  toRagEmporixToolConfig,
} from '../../utils/ragEmporixToolHelpers'
import RagFieldRowLayout from './RagFieldRowLayout'
import RagFilterFieldsSection from './RagFilterFieldsSection'

const MIXINS_PREFIX = 'mixins.'
const isValidCustomFieldKey = (key?: string) =>
  !!key?.startsWith(MIXINS_PREFIX) && key.length > MIXINS_PREFIX.length

const normalizeEntityType = (
  value?: RagEntityType | string
): RagEntityType | undefined => {
  if (!value) return undefined

  if (value === RagEntityType.PRODUCT || value === 'PRODUCT') {
    return RagEntityType.PRODUCT
  }

  if (value === RagEntityType.INVALID || value === 'INVALID') {
    return RagEntityType.INVALID
  }

  return value as RagEntityType
}

const getRagEntityTypePath = (entityType?: RagEntityType | string) =>
  normalizeEntityType(entityType) ?? RagEntityType.PRODUCT

const ToolConfigPanel: React.FC<ToolConfigPanelProps> = ({
  visible,
  tool,
  onHide,
  onSave,
  appState,
}) => {
  const { t } = useTranslation()
  const { showError } = useToast()

  const ragProviderOptions = useMemo(
    () => [
      { label: t('llm_provider_openai'), value: RagLlmProvider.OPENAI },
      {
        label: t('llm_provider_emporix_openai'),
        value: RagLlmProvider.EMPORIX_OPENAI,
      },
      {
        label: t('llm_provider_self_hosted_ollama'),
        value: RagLlmProvider.SELF_HOSTED_OLLAMA,
      },
    ],
    [t]
  )

  const [toolId, setToolId] = useState('')
  const [toolName, setToolName] = useState('')
  const [config, setConfig] = useState<ToolConfig>({})
  const [saving, setSaving] = useState(false)
  const [slackInstallLoading, setSlackInstallLoading] = useState(false)
  const [toolType, setToolType] = useState('')
  const [availableTokens, setAvailableTokens] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [availableFilterFields, setAvailableFilterFields] = useState<
    RagFilterMetadataField[]
  >([])

  const getToolTypeDisplayValue = (type: string): string => {
    switch (type) {
      case 'slack':
        return t('slack')
      case 'rag_custom':
        return t('rag_custom')
      case 'rag_emporix':
        return t('rag_emporix')
      default:
        return type
    }
  }

  useEffect(() => {
    if (tool) {
      setToolId(tool.id || '')
      setToolName(tool.name)
      setToolType(tool.type || '')

      setConfig({ ...tool.config })
    }
  }, [tool])

  const loadAvailableTokens = useCallback(async () => {
    if (!appState) return

    try {
      const tokens = await getTokens(appState)
      setAvailableTokens(tokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      showError(t('error_loading_tokens'))
    }
  }, [appState, showError, t])

  const loadAvailableFields = useCallback(async () => {
    if (!appState) return

    try {
      const fields = await getRagMetadata(
        appState,
        getRagEntityTypePath(config.entityType)
      )
      setAvailableFields(fields)
    } catch (error) {
      console.error('Failed to load fields:', error)
      showError(t('error_loading_fields'))
    }
  }, [appState, config.entityType, showError, t])

  const loadAvailableFilterFields = useCallback(async () => {
    if (!appState) return

    try {
      const fields = await getRagFilterMetadata(
        appState,
        getRagEntityTypePath(config.entityType)
      )
      setAvailableFilterFields(fields)
    } catch (error) {
      console.error('Failed to load filter fields:', error)
      showError(t('error_loading_filter_fields'))
    }
  }, [appState, config.entityType, showError, t])

  useEffect(() => {
    if ((toolType === 'rag_custom' || toolType === 'rag_emporix') && appState) {
      loadAvailableTokens()
    }
  }, [toolType, appState, loadAvailableTokens])

  useEffect(() => {
    if (toolType === 'rag_emporix' && appState) {
      loadAvailableFields()
      loadAvailableFilterFields()
    }
  }, [toolType, appState, loadAvailableFields, loadAvailableFilterFields])

  useEffect(() => {
    if (toolType === 'rag_emporix') {
      const embeddingConfig =
        (config.embeddingConfig as RagEmporixEmbeddingConfig) || {}
      const needsUpdate = !config.entityType || !embeddingConfig.provider

      if (needsUpdate) {
        setConfig((prev) => ({
          ...prev,
          entityType:
            normalizeEntityType(config.entityType) || RagEntityType.PRODUCT,
          embeddingConfig: {
            ...embeddingConfig,
            provider: embeddingConfig.provider || RagLlmProvider.EMPORIX_OPENAI,
          },
        }))
      }
    }
  }, [toolType, config.entityType, config.embeddingConfig])

  useEffect(() => {
    if (toolType === 'rag_custom') {
      const databaseConfig = config.databaseConfig || {}
      const normalizedEntityType = normalizeEntityType(
        databaseConfig.entityType
      )
      const needsUpdate = !databaseConfig.type || !normalizedEntityType

      if (needsUpdate) {
        setConfig((prev) => ({
          ...prev,
          databaseConfig: {
            ...databaseConfig,
            type: databaseConfig.type || RagCustomDatabase.QDRANT,
            entityType: normalizedEntityType || RagEntityType.PRODUCT,
          },
        }))
      }
    }
  }, [toolType, config.databaseConfig])

  const handleSave = async () => {
    if (!tool) return

    setSaving(true)
    try {
      const updatedTool: Tool = {
        id: toolId,
        name: toolName,
        type: toolType,
        config:
          toolType === 'rag_emporix' ? toRagEmporixToolConfig(config) : config,
        enabled: tool.enabled ?? true,
      }

      onSave(updatedTool)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('failed_to_save_tool')
      showError(`${t('error_saving_tool')}: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateNestedConfig = (
    parentKey: string,
    childKey: string,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [parentKey]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((prev as any)[parentKey] || {}),
        [childKey]: value,
      },
    }))
  }

  const updateDeeplyNestedConfig = (
    parentKey: string,
    childKey: string,
    grandchildKey: string,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [parentKey]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((prev as any)[parentKey] || {}),
        [childKey]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...((prev as any)[parentKey]?.[childKey] || {}),
          [grandchildKey]: value,
        },
      },
    }))
  }

  const handleSlackInstallation = async () => {
    if (!appState) {
      showError(t('error_app_state_missing'))
      return
    }

    setSlackInstallLoading(true)
    try {
      const { id: stateId, clientId } = await getSlackInstallationData(appState)
      const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=app_mentions:read,channels:history,channels:manage,channels:read,channels:write.invites,chat:write,groups:read,groups:write,users:read,users:read.email&user_scope=&state=${stateId}`
      window.location.href = slackOAuthUrl
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_initiate_slack_installation')
      showError(`${t('error_slack_installation')}: ${errorMessage}`)
    } finally {
      setSlackInstallLoading(false)
    }
  }

  const renderSlackConfigFields = () => {
    const isCreating = !tool?.id

    return (
      <>
        {isCreating && (
          <>
            <div className="slack-install-section">
              <h3 className="section-title">{t('install_emporix_slack_ai')}</h3>
              <p className="section-subtitle">
                {t('slack_install_description')}
              </p>
              <div className="slack-install-button-container">
                <Button
                  onClick={handleSlackInstallation}
                  loading={slackInstallLoading}
                  disabled={slackInstallLoading}
                  className="slack-install-button"
                >
                  <img
                    alt="Add to Slack"
                    height="40"
                    width="139"
                    src="https://platform.slack-edge.com/img/add_to_slack.png"
                    srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                  />
                </Button>
              </div>
            </div>

            <div className="form-separator">
              <div className="separator-line"></div>
              <span className="separator-text">{t('or')}</span>
              <div className="separator-line"></div>
            </div>

            <div className="manual-config-section">
              <h3 className="section-title">{t('provide_values_manually')}</h3>
              <p className="section-subtitle">
                {t('manual_config_description')}
              </p>
            </div>
          </>
        )}

        <div className="form-field">
          <label className="field-label">
            {t('tool_id')}
            {!tool?.id && <span className="field-required-mark"> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(sanitizeIdInput(e.target.value))}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">{t('tool_id_required')}</small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name')}
          />
          {!toolName.trim() && (
            <small className="p-error">{t('tool_name_required')}</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('team_id')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputText
            value={config.teamId || ''}
            onChange={(e) => updateConfig('teamId', e.target.value)}
            className={`w-full ${!config.teamId?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_team_id')}
          />
          {!config.teamId?.trim() && (
            <small className="p-error">{t('team_id_required')}</small>
          )}
        </div>
        {!tool?.id && (
          <div className="form-field">
            <label className="field-label">
              {t('bot_token')}
              <span className="field-required-mark"> *</span>
            </label>
            <InputText
              value={config.botToken || ''}
              onChange={(e) => updateConfig('botToken', e.target.value)}
              className={`w-full ${!config.botToken?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_bot_token')}
              type="password"
            />
            {!config.botToken?.trim() && (
              <small className="p-error">{t('bot_token_required')}</small>
            )}
          </div>
        )}
      </>
    )
  }

  const renderRagCustomConfigFields = () => {
    const databaseConfig = config.databaseConfig || {}
    const embeddingConfig = config.embeddingConfig || {}
    const maxResults = config.maxResults ?? 5

    // Enums
    const databaseTypes = [{ label: 'Qdrant', value: 'qdrant' }]
    const entityTypes = [{ label: t('product'), value: RagEntityType.PRODUCT }]

    return (
      <>
        <div className="form-field">
          <label className="field-label">
            {t('tool_id')}
            {!tool?.id && <span className="field-required-mark"> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(sanitizeIdInput(e.target.value))}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">{t('tool_id_required')}</small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name')}
          />
          {!toolName.trim() && (
            <small className="p-error">{t('tool_name_required')}</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('prompt')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputTextarea
            value={config.prompt || ''}
            onChange={(e) => updateConfig('prompt', e.target.value)}
            className={`w-full ${!config.prompt?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_prompt')}
            rows={3}
          />
          {!config.prompt?.trim() && (
            <small className="p-error">{t('prompt_required')}</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('max_results')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputNumber
            value={maxResults}
            onValueChange={(e) =>
              updateConfig('maxResults', String(e.value ?? 5))
            }
            className={`w-full ${maxResults < 1 || maxResults > 100 ? 'p-invalid' : ''}`}
            placeholder={t('enter_max_results')}
            min={1}
            max={100}
          />
          {(maxResults < 1 || maxResults > 100) && (
            <small className="p-error">{t('max_results_range')}</small>
          )}
        </div>

        <div className="config-section">
          <h3 className="section-title">{t('database_configuration')}</h3>

          <div className="form-field">
            <label className="field-label">
              {t('database_url')}
              <span className="field-required-mark"> *</span>
            </label>
            <InputText
              value={databaseConfig.url || ''}
              onChange={(e) =>
                updateNestedConfig('databaseConfig', 'url', e.target.value)
              }
              className={`w-full ${!databaseConfig.url?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_database_url')}
            />
            {!databaseConfig.url?.trim() && (
              <small className="p-error">{t('database_url_required')}</small>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('database_type')}
              <span className="field-required-mark"> *</span>
            </label>
            <Dropdown
              value={databaseConfig.type || 'qdrant'}
              options={databaseTypes}
              onChange={(e) =>
                updateNestedConfig('databaseConfig', 'type', e.value)
              }
              className="w-full"
              disabled
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('entity_type')}
              <span className="field-required-mark"> *</span>
            </label>
            <Dropdown
              value={databaseConfig.entityType || RagEntityType.PRODUCT}
              options={entityTypes}
              onChange={(e) =>
                updateNestedConfig('databaseConfig', 'entityType', e.value)
              }
              className="w-full"
              disabled
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('collection_name')}
              <span className="field-required-mark"> *</span>
            </label>
            <InputText
              value={databaseConfig.collectionName || ''}
              onChange={(e) =>
                updateNestedConfig(
                  'databaseConfig',
                  'collectionName',
                  e.target.value
                )
              }
              className={`w-full ${!databaseConfig.collectionName?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_collection_name')}
            />
            {!databaseConfig.collectionName?.trim() && (
              <small className="p-error">{t('collection_name_required')}</small>
            )}
          </div>

          <div className="form-field form-field-spaced">
            <label className="field-label">
              {t('token')}
              <span className="field-required-mark"> *</span>
            </label>
            <Dropdown
              value={databaseConfig.token?.id || ''}
              options={availableTokens}
              onChange={(e) =>
                updateDeeplyNestedConfig(
                  'databaseConfig',
                  'token',
                  'id',
                  e.value
                )
              }
              className={`w-full ${!databaseConfig.token?.id ? 'p-invalid' : ''}`}
              placeholder={t('select_token')}
              optionLabel="name"
              optionValue="id"
            />
            {!databaseConfig.token?.id && (
              <small className="p-error">{t('token_required')}</small>
            )}
          </div>
        </div>

        <div className="config-section">
          <h3 className="section-title">{t('embedding_configuration')}</h3>

          <div className="form-field">
            <label className="field-label">
              {t('model')}
              <span className="field-required-mark"> *</span>
            </label>
            <InputText
              value={embeddingConfig.model || ''}
              onChange={(e) =>
                updateNestedConfig('embeddingConfig', 'model', e.target.value)
              }
              className={`w-full ${!embeddingConfig.model?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_model')}
            />
            {!embeddingConfig.model?.trim() && (
              <small className="p-error">{t('model_required')}</small>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('token')}
              <span className="field-required-mark"> *</span>
            </label>
            <Dropdown
              value={embeddingConfig.token?.id || ''}
              options={availableTokens}
              onChange={(e) =>
                updateDeeplyNestedConfig(
                  'embeddingConfig',
                  'token',
                  'id',
                  e.value
                )
              }
              className={`w-full ${!embeddingConfig.token?.id ? 'p-invalid' : ''}`}
              placeholder={t('select_token')}
              optionLabel="name"
              optionValue="id"
            />
            {!embeddingConfig.token?.id && (
              <small className="p-error">{t('token_required')}</small>
            )}
          </div>
        </div>
      </>
    )
  }

  const renderRagEmporixConfigFields = () => {
    const indexedFields = config.indexedFields || []
    const filterFields = config.filterFields || []
    const embeddingConfig = (config.embeddingConfig ||
      {}) as RagEmporixEmbeddingConfig
    const dimensionsValue = embeddingConfig.dimensions
      ? Number(embeddingConfig.dimensions)
      : 0
    const isDimensionsInvalid =
      embeddingConfig.dimensions === null ||
      embeddingConfig.dimensions === undefined ||
      dimensionsValue < 128 ||
      dimensionsValue > 4096
    const entityTypes = [{ label: t('product'), value: RagEntityType.PRODUCT }]

    const addIndexedField = () => {
      const newFields = [...indexedFields, { name: '', key: '' }]
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const addCustomIndexedField = () => {
      const newFields = [
        ...indexedFields,
        { name: '', key: MIXINS_PREFIX, custom: true },
      ]
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const removeIndexedField = (index: number) => {
      const newFields = indexedFields.filter((_, i) => i !== index)
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const updateIndexedField = (
      index: number,
      field: keyof Pick<RagEmporixFieldConfig, 'name' | 'key'>,
      value: string
    ) => {
      const newFields = [...indexedFields]
      newFields[index] = { ...newFields[index], [field]: value }
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const getAvailableFieldsForIndex = (currentIndex: number) => {
      const selectedKeys = indexedFields
        .map((field, i) =>
          i !== currentIndex && field.key?.trim() ? field.key : null
        )
        .filter((key): key is string => !!key)

      return availableFields.filter((field) => {
        const hasConflict = selectedKeys.some((selectedKey: string) => {
          const isExactMatch = field === selectedKey
          const isParentOfSelected = selectedKey.startsWith(`${field}.`)
          const isChildOfSelected = field.startsWith(`${selectedKey}.`)

          return isExactMatch || isParentOfSelected || isChildOfSelected
        })

        return !hasConflict
      })
    }

    const addFilterField = () => {
      setConfig((prev) => ({
        ...prev,
        filterFields: [...(prev.filterFields ?? []), createEmptyFilterField()],
      }))
    }

    const removeFilterField = (index: number) => {
      const newFields = filterFields.filter((_, i) => i !== index)
      setConfig((prev) => ({
        ...prev,
        filterFields: newFields,
      }))
    }

    const updateFilterField = (
      index: number,
      field: keyof Pick<RagEmporixFilterFieldConfig, 'name' | 'description'>,
      value: string
    ) => {
      const newFields = [...filterFields]
      newFields[index] = { ...newFields[index], [field]: value }
      setConfig((prev) => ({
        ...prev,
        filterFields: newFields,
      }))
    }

    const selectFilterFieldKey = (index: number, key?: string | null) => {
      const newFields = [...filterFields]

      if (!key?.trim()) {
        newFields[index] = createEmptyFilterField()
      } else {
        const metadata = availableFilterFields.find(
          (field) => field.key === key
        )
        newFields[index] = {
          key,
          name: metadata?.name ?? '',
          description: metadata?.description ?? '',
        }
      }

      setConfig((prev) => ({
        ...prev,
        filterFields: newFields,
      }))
    }

    const requiresTokenAndModel = (provider?: RagLlmProvider) => {
      return (
        provider === RagLlmProvider.OPENAI ||
        provider === RagLlmProvider.SELF_HOSTED_OLLAMA
      )
    }

    const requiresUrl = (provider?: RagLlmProvider) => {
      return provider === RagLlmProvider.SELF_HOSTED_OLLAMA
    }

    return (
      <>
        <div className="form-field">
          <label className="field-label">
            {t('tool_id')}
            {!tool?.id && <span className="field-required-mark"> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(sanitizeIdInput(e.target.value))}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">{t('tool_id_required')}</small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name')}
          />
          {!toolName.trim() && (
            <small className="p-error">{t('tool_name_required')}</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('prompt')}
            <span className="field-required-mark"> *</span>
          </label>
          <InputTextarea
            value={config.prompt || ''}
            onChange={(e) => updateConfig('prompt', e.target.value)}
            className={`w-full ${!config.prompt?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_prompt')}
            rows={3}
          />
          {!config.prompt?.trim() && (
            <small className="p-error">{t('prompt_required')}</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('provider')}
            <span className="field-required-mark"> *</span>
          </label>
          <Dropdown
            value={embeddingConfig.provider || ''}
            options={ragProviderOptions}
            onChange={(e) =>
              updateNestedConfig('embeddingConfig', 'provider', e.value)
            }
            className={`w-full ${!embeddingConfig.provider ? 'p-invalid' : ''}`}
            placeholder={t('select_provider')}
          />
          {!embeddingConfig.provider && (
            <small className="p-error">{t('provider_required')}</small>
          )}
        </div>

        {requiresTokenAndModel(embeddingConfig.provider) && (
          <>
            <div className="form-field">
              <label className="field-label">
                {t('model')}
                <span className="field-required-mark"> *</span>
              </label>
              <InputText
                value={embeddingConfig.model || ''}
                onChange={(e) =>
                  updateNestedConfig('embeddingConfig', 'model', e.target.value)
                }
                className={`w-full ${!embeddingConfig.model?.trim() ? 'p-invalid' : ''}`}
                placeholder={t('enter_model')}
              />
              {!embeddingConfig.model?.trim() && (
                <small className="p-error">{t('model_required')}</small>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                {t('dimensions')}
                <span className="field-required-mark"> *</span>
              </label>
              <InputNumber
                value={dimensionsValue}
                disabled={!!tool?.id}
                onChange={(e) => {
                  const numValue =
                    e.value !== null && e.value !== undefined ? e.value : null
                  setConfig((prev) => ({
                    ...prev,
                    embeddingConfig: {
                      ...(prev.embeddingConfig as RagEmporixEmbeddingConfig),
                      dimensions: numValue,
                    },
                  }))
                }}
                className={`w-full ${isDimensionsInvalid ? 'p-invalid' : ''}`}
                placeholder={t('enter_dimensions')}
              />
              {isDimensionsInvalid && (
                <small className="p-error">{t('dimensions_range')}</small>
              )}
            </div>
          </>
        )}

        {requiresUrl(embeddingConfig.provider) && (
          <div className="form-field">
            <label className="field-label">
              {t('url')}
              <span className="field-required-mark"> *</span>
            </label>
            <InputText
              value={embeddingConfig.url || ''}
              onChange={(e) =>
                updateNestedConfig('embeddingConfig', 'url', e.target.value)
              }
              className={`w-full ${!embeddingConfig.url?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_url')}
            />
            {!embeddingConfig.url?.trim() && (
              <small className="p-error">{t('url_required')}</small>
            )}
          </div>
        )}

        {requiresTokenAndModel(embeddingConfig.provider) && (
          <div className="form-field">
            <label className="field-label">
              {t('token')}
              <span className="field-required-mark"> *</span>
            </label>
            <Dropdown
              value={embeddingConfig.token?.id || ''}
              options={availableTokens}
              onChange={(e) =>
                updateDeeplyNestedConfig(
                  'embeddingConfig',
                  'token',
                  'id',
                  e.value
                )
              }
              className={`w-full ${!embeddingConfig.token?.id ? 'p-invalid' : ''}`}
              placeholder={t('select_token')}
              optionLabel="name"
              optionValue="id"
            />
            {!embeddingConfig.token?.id && (
              <small className="p-error">{t('token_required')}</small>
            )}
          </div>
        )}

        <div className="form-field">
          <label className="field-label">
            {t('entity_type')}
            <span className="field-required-mark"> *</span>
          </label>
          <Dropdown
            value={
              normalizeEntityType(config.entityType) || RagEntityType.PRODUCT
            }
            options={entityTypes}
            onChange={(e) => updateConfig('entityType', e.value)}
            className="w-full"
            disabled
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('indexed_fields')}
            <span className="field-required-mark"> *</span>
          </label>

          {indexedFields.map((field: RagEmporixFieldConfig, index: number) => (
            <RagFieldRowLayout
              key={index}
              primaryClassName="tool-field-row__name"
              secondaryClassName="tool-field-row__key-wide"
              onRemove={() => removeIndexedField(index)}
              removeAriaLabel={t('remove_field')}
              removeTooltip={t('remove_field')}
              primaryField={
                <>
                  <label className="field-label">{t('field_name')}</label>
                  <InputText
                    value={field.name || ''}
                    onChange={(e) =>
                      updateIndexedField(index, 'name', e.target.value)
                    }
                    className="w-full"
                    placeholder={t('enter_field_name')}
                  />
                </>
              }
              secondaryField={
                <>
                  <label className="field-label">
                    {t('field_key')}
                    <span className="field-required-mark"> *</span>
                  </label>
                  {field.custom ||
                  (field.key?.startsWith(MIXINS_PREFIX) &&
                    !availableFields.includes(field.key)) ? (
                    <>
                      <InputText
                        value={field.key || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          updateIndexedField(
                            index,
                            'key',
                            newValue.startsWith(MIXINS_PREFIX)
                              ? newValue
                              : MIXINS_PREFIX
                          )
                        }}
                        className={`w-full ${!isValidCustomFieldKey(field.key) ? 'p-invalid' : ''}`}
                        placeholder={t('enter_custom_field_key')}
                      />
                      {!isValidCustomFieldKey(field.key) && (
                        <small className="p-error">
                          {t('custom_field_key_invalid')}
                        </small>
                      )}
                    </>
                  ) : (
                    <>
                      <Dropdown
                        value={field.key || ''}
                        options={getAvailableFieldsForIndex(index).map(
                          (f) => ({ label: f, value: f })
                        )}
                        onChange={(e) =>
                          updateIndexedField(index, 'key', e.value)
                        }
                        className={`w-full rag-field-key-dropdown ${!field.key?.trim() ? 'p-invalid' : ''}`}
                        placeholder={t('select_field_key')}
                        tooltip={field.key?.trim() || undefined}
                        tooltipOptions={{ position: 'top' }}
                        filter
                        showClear
                      />
                      {!field.key?.trim() && (
                        <small className="p-error">
                          {t('field_key_required')}
                        </small>
                      )}
                    </>
                  )}
                </>
              }
            />
          ))}

          <div className="field-list-actions">
            <Button
              icon="pi pi-plus"
              label={t('add_indexed_field')}
              onClick={addIndexedField}
              className="p-button-secondary"
            />
            <Button
              icon="pi pi-plus"
              label={t('add_custom_field')}
              onClick={addCustomIndexedField}
              className="p-button-secondary"
            />
          </div>

          {indexedFields.length === 0 && (
            <small className="p-error field-validation-message">
              {t('indexed_fields_required')}
            </small>
          )}
        </div>

        <RagFilterFieldsSection
          filterFields={filterFields}
          availableFilterFields={availableFilterFields}
          onAdd={addFilterField}
          onRemove={removeFilterField}
          onUpdateField={updateFilterField}
          onSelectKey={selectFilterFieldKey}
        />
      </>
    )
  }

  const renderConfigFields = () => {
    if (!tool) return null

    switch (toolType) {
      case 'slack':
        return renderSlackConfigFields()
      case 'rag_custom':
        return renderRagCustomConfigFields()

      case 'rag_emporix':
        return renderRagEmporixConfigFields()

      default:
        return (
          <div className="form-field">
            <label className="field-label">
              {t('configuration')}
            </label>
            <pre className="config-json">{JSON.stringify(config, null, 2)}</pre>
          </div>
        )
    }
  }

  const validateModelAndDimensions = (
    embeddingConfig: RagEmporixEmbeddingConfig
  ): boolean => {
    return (
      !!embeddingConfig.model?.trim() &&
      !!embeddingConfig.dimensions &&
      embeddingConfig.dimensions >= 128 &&
      embeddingConfig.dimensions <= 4096
    )
  }

  const canSave = () => {
    if (
      saving ||
      !toolName.trim() ||
      (!tool?.id && !toolId.trim()) ||
      !toolType.trim()
    ) {
      return false
    }

    switch (toolType) {
      case 'slack':
        return (
          !!config.teamId?.trim() && (!!tool?.id || !!config.botToken?.trim())
        )

      case 'rag_custom': {
        const databaseConfig = config.databaseConfig || {}
        const embeddingConfig = config.embeddingConfig || {}
        const maxResults = config.maxResults ?? 5
        return (
          !!config.prompt?.trim() &&
          maxResults >= 1 &&
          maxResults <= 100 &&
          !!databaseConfig.url?.trim() &&
          !!databaseConfig.collectionName?.trim() &&
          !!databaseConfig.token?.id &&
          !!embeddingConfig.model?.trim() &&
          !!embeddingConfig.token?.id
        )
      }

      case 'rag_emporix': {
        const indexedFields = config.indexedFields || []
        const filterFieldsConfig = config.filterFields ?? []
        const embeddingConfig = (config.embeddingConfig ||
          {}) as RagEmporixEmbeddingConfig

        if (!config.prompt?.trim() || indexedFields.length === 0) {
          return false
        }

        const hasValidIndexedFields = indexedFields.every(
          (field: RagEmporixFieldConfig) => {
            if (!isValidRagFieldKey(field.key)) return false
            if (field.custom || field.key.startsWith(MIXINS_PREFIX)) {
              return isValidCustomFieldKey(field.key)
            }
            return true
          }
        )

        if (
          !hasValidIndexedFields ||
          !areRagEmporixFilterFieldsValid(filterFieldsConfig)
        ) {
          return false
        }

        if (!embeddingConfig.provider) {
          return false
        }

        if (embeddingConfig.provider === RagLlmProvider.EMPORIX_OPENAI) {
          return true
        }

        if (embeddingConfig.provider === RagLlmProvider.OPENAI) {
          return (
            validateModelAndDimensions(embeddingConfig) &&
            !!embeddingConfig.token?.id
          )
        }

        if (embeddingConfig.provider === RagLlmProvider.SELF_HOSTED_OLLAMA) {
          return (
            validateModelAndDimensions(embeddingConfig) &&
            !!embeddingConfig.url?.trim() &&
            !!embeddingConfig.token?.id
          )
        }

        return false
      }

      default:
        return true
    }
  }

  return (
    <BaseConfigPanel
      visible={visible}
      onHide={onHide}
      title={t('tool_configuration')}
      icon={faTools}
      iconName={toolName}
      onSave={handleSave}
      saving={saving}
      canSave={canSave()}
      className="tool-config-panel"
    >
      <div className="form-field">
        <label className="field-label">
          {t('tool_type')}
          {!tool?.id && <span className="field-required-mark"> *</span>}
        </label>
        {tool?.id ? (
          <InputText
            value={getToolTypeDisplayValue(toolType)}
            className="w-full"
            disabled
          />
        ) : (
          <Dropdown
            value={toolType}
            options={[
              { label: t('slack'), value: 'slack' },
              {
                label: t('rag_custom'),
                value: 'rag_custom',
              },
              {
                label: t('rag_emporix'),
                value: 'rag_emporix',
              },
            ]}
            onChange={(e) => {
              setToolType(e.value)
              setConfig({})
            }}
            className={`w-full ${!toolType ? 'p-invalid' : ''}`}
            placeholder={t('select_tool_type')}
          />
        )}
        {!tool?.id && !toolType && (
          <small className="p-error">{t('tool_type_required')}</small>
        )}
      </div>

      {renderConfigFields()}
    </BaseConfigPanel>
  )
}

export default ToolConfigPanel
