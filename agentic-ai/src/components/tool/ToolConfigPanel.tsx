import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Tool, ToolConfigPanelProps } from '../../types/Tool'
import { ToolsService } from '../../services/toolsService'
import { AiRagIndexerService } from '../../services/aiRagIndexerService'
import { useToast } from '../../contexts/ToastContext'
import { BaseConfigPanel } from '../shared/BaseConfigPanel'
import { faTools } from '@fortawesome/free-solid-svg-icons'
import '../../styles/components/ToolConfigPanel.css'

const ToolConfigPanel: React.FC<ToolConfigPanelProps> = ({
  visible,
  tool,
  onHide,
  onSave,
  appState,
  isRagFeatureEnabled = true,
}) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const [toolId, setToolId] = useState('')
  const [toolName, setToolName] = useState('')
  const [toolType, setToolType] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [slackInstallLoading, setSlackInstallLoading] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [availableFields, setAvailableFields] = useState<string[]>([])

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
      const toolsService = new ToolsService(appState)
      const tokens = await toolsService.getTokens()
      setAvailableTokens(tokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      showError(t('error_loading_tokens', 'Failed to load available tokens'))
    }
  }, [appState, showError, t])

  const loadAvailableFields = useCallback(async () => {
    if (!appState) return

    try {
      const aiRagIndexerService = new AiRagIndexerService(appState)
      // Use 'product' as the default entity type for now
      const fields = await aiRagIndexerService.getRagMetadata('product')
      setAvailableFields(fields)
    } catch (error) {
      console.error('Failed to load fields:', error)
      showError(t('error_loading_fields', 'Failed to load available fields'))
    }
  }, [appState, showError, t])

  useEffect(() => {
    // Load available tokens for rag_custom tool type
    if (toolType === 'rag_custom' && appState) {
      loadAvailableTokens()
    }
  }, [toolType, appState, loadAvailableTokens])

  useEffect(() => {
    // Load available fields for rag_emporix tool type
    if (toolType === 'rag_emporix' && appState) {
      loadAvailableFields()
    }
  }, [toolType, appState, loadAvailableFields])

  useEffect(() => {
    // Initialize default values for rag_emporix tool type
    if (toolType === 'rag_emporix' && !config.entityType) {
      setConfig((prev) => ({
        ...prev,
        entityType: 'product',
      }))
    }
  }, [toolType, config.entityType])

  const handleSave = async () => {
    if (!tool) return

    setSaving(true)
    try {
      const updatedTool: Tool = {
        id: toolId,
        name: toolName,
        type: toolType,
        config,
        enabled: tool.enabled ?? true,
      };

      onSave(updatedTool)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save tool'
      showError(
        `${t('error_saving_tool', 'Error saving tool')}: ${errorMessage}`
      )
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value,
      },
    }))
  }

  const updateDeeplyNestedConfig = (
    parentKey: string,
    childKey: string,
    grandchildKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...((prev[parentKey] as any)?.[childKey] || {}),
          [grandchildKey]: value,
        },
      },
    }))
  }

  const handleSlackInstallation = async () => {
    if (!appState) {
      showError(t('error_app_state_missing', 'Application state is missing'))
      return
    }

    setSlackInstallLoading(true)
    try {
      const toolsService = new ToolsService(appState)
      const { id: stateId, clientId } =
        await toolsService.getSlackInstallationData()
      const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=app_mentions:read,channels:history,channels:manage,channels:read,channels:write.invites,chat:write,groups:read,groups:write,users:read,users:read.email&user_scope=&state=${stateId}`
      window.location.href = slackOAuthUrl
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initiate Slack installation'
      showError(
        `${t('error_slack_installation', 'Error initiating Slack installation')}: ${errorMessage}`
      )
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
              <h3 className="section-title">
                {t('install_emporix_slack_ai', 'Install Emporix Slack AI')}
              </h3>
              <p className="section-subtitle">
                {t(
                  'slack_install_description',
                  'Quick setup with one click. Automatically configure your Slack workspace with the necessary permissions.'
                )}
              </p>
              <div className="slack-install-button-container">
                <Button
                  onClick={handleSlackInstallation}
                  loading={slackInstallLoading}
                  disabled={slackInstallLoading}
                  className="slack-install-button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    borderRadius: '12px',
                  }}
                >
                  <img
                    alt="Add to Slack"
                    height="40"
                    width="139"
                    src="https://platform.slack-edge.com/img/add_to_slack.png"
                    srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    style={{
                      borderRadius: '12px',
                      opacity: slackInstallLoading ? 0.6 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </Button>
              </div>
            </div>

            <div className="form-separator">
              <div className="separator-line"></div>
              <span className="separator-text">{t('or', 'or')}</span>
              <div className="separator-line"></div>
            </div>

            <div className="manual-config-section">
              <h3 className="section-title">
                {t('provide_values_manually', 'Provide the values manually')}
              </h3>
              <p className="section-subtitle">
                {t(
                  'manual_config_description',
                  'Enter your Slack workspace details manually if you prefer custom configuration.'
                )}
              </p>
            </div>
          </>
        )}

        {/* Tool ID and Name fields */}
        <div className="form-field">
          <label className="field-label">
            {t('tool_id', 'Tool ID')}
            {!tool?.id && <span style={{ color: 'red' }}> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(e.target.value)}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id', 'Enter tool ID')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">
              {t('tool_id_required', 'Tool ID is required')}
            </small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name', 'Tool Name')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name', 'Enter tool name')}
          />
          {!toolName.trim() && (
            <small className="p-error">
              {t('tool_name_required', 'Tool name is required')}
            </small>
          )}
        </div>

        {/* Slack-specific configuration fields */}
        <div className="form-field">
          <label className="field-label">
            {t('team_id', 'Team ID')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputText
            value={config.teamId || ''}
            onChange={(e) => updateConfig('teamId', e.target.value)}
            className={`w-full ${!config.teamId?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_team_id', 'Enter team ID')}
          />
          {!config.teamId?.trim() && (
            <small className="p-error">
              {t('team_id_required', 'Team ID is required')}
            </small>
          )}
        </div>
        {!tool?.id && (
          <div className="form-field">
            <label className="field-label">
              {t('bot_token', 'Bot Token')}
              <span style={{ color: 'red' }}> *</span>
            </label>
            <InputText
              value={config.botToken || ''}
              onChange={(e) => updateConfig('botToken', e.target.value)}
              className={`w-full ${!config.botToken?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_bot_token', 'Enter bot token')}
              type="password"
            />
            {!config.botToken?.trim() && (
              <small className="p-error">
                {t('bot_token_required', 'Bot token is required')}
              </small>
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
    const entityTypes = [{ label: 'Product', value: 'product' }]

    return (
      <>
        {/* Tool ID and Name fields */}
        <div className="form-field">
          <label className="field-label">
            {t('tool_id', 'Tool ID')}
            {!tool?.id && <span style={{ color: 'red' }}> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(e.target.value)}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id', 'Enter tool ID')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">
              {t('tool_id_required', 'Tool ID is required')}
            </small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name', 'Tool Name')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name', 'Enter tool name')}
          />
          {!toolName.trim() && (
            <small className="p-error">
              {t('tool_name_required', 'Tool name is required')}
            </small>
          )}
        </div>

        {/* Prompt field */}
        <div className="form-field">
          <label className="field-label">
            {t('prompt', 'Prompt')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputTextarea
            value={config.prompt || ''}
            onChange={(e) => updateConfig('prompt', e.target.value)}
            className={`w-full ${!config.prompt?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_prompt', 'Enter prompt')}
            rows={3}
          />
          {!config.prompt?.trim() && (
            <small className="p-error">
              {t('prompt_required', 'Prompt is required')}
            </small>
          )}
        </div>

        {/* Max Results field */}
        <div className="form-field">
          <label className="field-label">
            {t('max_results', 'Max Results')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputNumber
            value={maxResults}
            onValueChange={(e) =>
              updateConfig('maxResults', String(e.value ?? 5))
            }
            className={`w-full max-results-input-number ${maxResults < 1 || maxResults > 100 ? 'p-invalid' : ''}`}
            placeholder={t('enter_max_results', 'Enter max results (1-100)')}
            min={1}
            max={100}
            showButtons
          />
          {(maxResults < 1 || maxResults > 100) && (
            <small className="p-error">
              {t('max_results_range', 'Max results must be between 1 and 100')}
            </small>
          )}
        </div>

        {/* Database Configuration Section */}
        <div className="config-section">
          <h3 className="section-title">
            {t('database_configuration', 'Database Configuration')}
          </h3>

          <div className="form-field">
            <label className="field-label">
              {t('database_url', 'Database URL')}
              <span style={{ color: 'red' }}> *</span>
            </label>
            <InputText
              value={databaseConfig.url || ''}
              onChange={(e) =>
                updateNestedConfig('databaseConfig', 'url', e.target.value)
              }
              className={`w-full ${!databaseConfig.url?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_database_url', 'Enter database URL')}
            />
            {!databaseConfig.url?.trim() && (
              <small className="p-error">
                {t('database_url_required', 'Database URL is required')}
              </small>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('database_type', 'Database Type')}
              <span style={{ color: 'red' }}> *</span>
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
              {t('entity_type', 'Entity Type')}
              <span style={{ color: 'red' }}> *</span>
            </label>
            <Dropdown
              value={databaseConfig.entityType || 'product'}
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
              {t('collection_name', 'Collection Name')}
              <span style={{ color: 'red' }}> *</span>
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
              placeholder={t('enter_collection_name', 'Enter collection name')}
            />
            {!databaseConfig.collectionName?.trim() && (
              <small className="p-error">
                {t('collection_name_required', 'Collection name is required')}
              </small>
            )}
          </div>

          <div className="form-field" style={{marginBottom: '1.5rem'}}>
            <label className="field-label">
              {t('token', 'Token')}
              <span style={{ color: 'red' }}> *</span>
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
              placeholder={t('select_token', 'Select a token')}
              optionLabel="name"
              optionValue="id"
            />
            {!databaseConfig.token?.id && (
              <small className="p-error">
                {t('token_required', 'Token is required')}
              </small>
            )}
          </div>
        </div>

        {/* Embedding Configuration Section */}
        <div className="config-section">
          <h3 className="section-title">
            {t('embedding_configuration', 'Embedding Configuration')}
          </h3>

          <div className="form-field">
            <label className="field-label">
              {t('model', 'Model')}
              <span style={{ color: 'red' }}> *</span>
            </label>
            <InputText
              value={embeddingConfig.model || ''}
              onChange={(e) =>
                updateNestedConfig('embeddingConfig', 'model', e.target.value)
              }
              className={`w-full ${!embeddingConfig.model?.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_model', 'Enter model')}
            />
            {!embeddingConfig.model?.trim() && (
              <small className="p-error">
                {t('model_required', 'Model is required')}
              </small>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('token', 'Token')}
              <span style={{ color: 'red' }}> *</span>
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
              placeholder={t('select_token', 'Select a token')}
              optionLabel="name"
              optionValue="id"
            />
            {!embeddingConfig.token?.id && (
              <small className="p-error">
                {t('token_required', 'Token is required')}
              </small>
            )}
          </div>
        </div>
      </>
    )
  }

  const renderRagEmporixConfigFields = () => {
    const indexedFields = config.indexedFields || []
    const entityTypes = [{ label: 'Product', value: 'product' }]

    const addIndexedField = () => {
      const newFields = [...indexedFields, { name: '', key: '' }]
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const removeIndexedField = (index: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newFields = indexedFields.filter((_: any, i: number) => i !== index)
      setConfig((prev) => ({
        ...prev,
        indexedFields: newFields,
      }))
    }

    const updateIndexedField = (
      index: number,
      field: string,
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
      // Get all selected keys except the current one being edited
      const selectedKeys = indexedFields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((f: any, i: number) => (i !== currentIndex ? f.key : null))
        .filter((key: string | null) => key && key.trim())
        .map((key: string | null) => key as string)

      // Filter out fields that conflict with already selected fields
      return availableFields.filter((field) => {
        // Check if this field conflicts with any selected field
        const hasConflict = selectedKeys.some((selectedKey: string) => {
          // Check if field is exactly the same as selectedKey
          const isExactMatch = field === selectedKey
          // Check if field is a parent of selectedKey (e.g., 'brand' is parent of 'brand.localizedDescription')
          const isParentOfSelected = selectedKey.startsWith(`${field}.`)
          // Check if field is a child of selectedKey (e.g., 'brand.localizedDescription.en' is child of 'brand.localizedDescription')
          const isChildOfSelected = field.startsWith(`${selectedKey}.`)

          return isExactMatch || isParentOfSelected || isChildOfSelected
        })

        // Only include fields that don't have conflicts
        return !hasConflict
      })
    }

    return (
      <>
        {/* Tool ID and Name fields */}
        <div className="form-field">
          <label className="field-label">
            {t('tool_id', 'Tool ID')}
            {!tool?.id && <span style={{ color: 'red' }}> *</span>}
          </label>
          <InputText
            value={toolId}
            onChange={(e) => setToolId(e.target.value)}
            className={`w-full ${!tool?.id && !toolId.trim() ? 'p-invalid' : ''}`}
            disabled={!!tool?.id}
            placeholder={t('enter_tool_id', 'Enter tool ID')}
          />
          {!tool?.id && !toolId.trim() && (
            <small className="p-error">
              {t('tool_id_required', 'Tool ID is required')}
            </small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('tool_name', 'Tool Name')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputText
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className={`w-full ${!toolName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_tool_name', 'Enter tool name')}
          />
          {!toolName.trim() && (
            <small className="p-error">
              {t('tool_name_required', 'Tool name is required')}
            </small>
          )}
        </div>

        {/* Prompt field */}
        <div className="form-field">
          <label className="field-label">
            {t('prompt', 'Prompt')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <InputTextarea
            value={config.prompt || ''}
            onChange={(e) => updateConfig('prompt', e.target.value)}
            className={`w-full ${!config.prompt?.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_prompt', 'Enter prompt')}
            rows={3}
          />
          {!config.prompt?.trim() && (
            <small className="p-error">
              {t('prompt_required', 'Prompt is required')}
            </small>
          )}
        </div>

        {/* Entity Type field */}
        <div className="form-field">
          <label className="field-label">
            {t('entity_type', 'Entity Type')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <Dropdown
            value={config.entityType || 'product'}
            options={entityTypes}
            onChange={(e) => updateConfig('entityType', e.value)}
            className="w-full"
            disabled
          />
        </div>

        {/* Indexed Fields Section */}
        <div className="config-section">
          <h3 className="section-title">
            {t('indexed_fields', 'Indexed Fields')}
          </h3>
          <p className="section-subtitle">
            {t(
              'indexed_fields_description',
              'Configure the fields to be indexed for search'
            )}
          </p>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {indexedFields.map((field: any, index: number) => (
            <div key={index} className="indexed-field-group">
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div className="form-field" style={{ flex: 2 }}>
                  <label className="field-label">
                    {t('field_name', 'Name')}
                  </label>
                  <InputText
                    value={field.name || ''}
                    onChange={(e) =>
                      updateIndexedField(index, 'name', e.target.value)
                    }
                    className="w-full"
                    placeholder={t('enter_field_name', 'Enter field name')}
                  />
                </div>

                <div className="form-field" style={{ flex: 3 }}>
                  <label className="field-label">
                    {t('field_key', 'Key')}
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <Dropdown
                    value={field.key || ''}
                    options={getAvailableFieldsForIndex(index).map((f) => ({
                      label: f,
                      value: f,
                    }))}
                    onChange={(e) => updateIndexedField(index, 'key', e.value)}
                    className={`w-full ${!field.key?.trim() ? 'p-invalid' : ''}`}
                    placeholder={t('select_field_key', 'Select field key')}
                    filter
                    showClear
                  />
                  {!field.key?.trim() && (
                    <small className="p-error">
                      {t('field_key_required', 'Field key is required')}
                    </small>
                  )}
                </div>

                <div className="indexed-field-delete-button">
                  <Button
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={() => removeIndexedField(index)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            icon="pi pi-plus"
            label={t('add_indexed_field', 'Add Indexed Field')}
            onClick={addIndexedField}
            className="p-button-outlined"
            style={{ marginTop: '16px' }}
          />

          {indexedFields.length === 0 && (
            <small
              className="p-error"
              style={{ marginTop: '8px', display: 'block' }}
            >
              {t(
                'indexed_fields_required',
                'At least one indexed field is required'
              )}
            </small>
          )}
        </div>
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
              {t('configuration', 'Configuration')}
            </label>
            <pre className="config-json">{JSON.stringify(config, null, 2)}</pre>
          </div>
        )
    }
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
        if (!config.prompt?.trim() || indexedFields.length === 0) {
          return false
        }
        // Check all indexed fields have valid keys
        const isValidKey = (key: string) => /^[a-zA-Z0-9_.-]+$/.test(key)
        return indexedFields.every(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (field: any) => field.key?.trim() && isValidKey(field.key)
        )
      }

      default:
        return true
    }
  }

  return (
    <BaseConfigPanel
      visible={visible}
      onHide={onHide}
      title={t('tool_configuration', 'Tool Configuration')}
      icon={faTools}
      iconName={toolName}
      onSave={handleSave}
      saving={saving}
      canSave={canSave()}
      className="tool-config-panel"
    >
      <div className="form-field">
        <label className="field-label">
          {t('tool_type', 'Tool Type')}
          {!tool?.id && <span style={{ color: 'red' }}> *</span>}
        </label>
        {tool?.id ? (
          <InputText value={toolType} className="w-full" disabled />
        ) : (
          <Dropdown
            value={toolType}
            options={[
              { label: t('slack', 'Slack'), value: 'slack' },
              ...(isRagFeatureEnabled
                ? [
                    { label: t('rag_custom', 'RAG Custom'), value: 'rag_custom' },
                    { label: t('rag_emporix', 'RAG Emporix'), value: 'rag_emporix' },
                  ]
                : []),
            ]}
            onChange={(e) => {
              setToolType(e.value)
              setConfig({})
            }}
            className={`w-full ${!toolType ? 'p-invalid' : ''}`}
            placeholder={t('select_tool_type', 'Select tool type')}
          />
        )}
        {!tool?.id && !toolType && (
          <small className="p-error">
            {t('tool_type_required', 'Tool type is required')}
          </small>
        )}
      </div>

      {renderConfigFields()}
    </BaseConfigPanel>
  )
}

export default ToolConfigPanel
