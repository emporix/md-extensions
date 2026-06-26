import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { MultiSelect } from 'primereact/multiselect'
import { LocalizedString } from '../../../types/Agent'
import { LocalizedInput } from '../../shared/LocalizedInput'
import { IconPicker } from '../../shared/IconPicker'
import { GenerateJsonSchemaDialog } from './GenerateJsonSchemaDialog'
import { useToast } from '../../../contexts/ToastContext'
import starsIcon from '../../../assets/stars_icon.svg'
import {
  getAgentTagOptions,
  hasAnyLocalizedValue,
  iconMap,
} from '../../../utils/agentHelpers'
import { sanitizeIdInput } from '../../../utils/validation'
import {
  getAgentOutputValidationMessage,
  validateAgentOutputJsonSchema,
} from '../../../utils/validateJsonSchema'

const OUTPUT_VALIDATION_DEBOUNCE_MS = 400

interface AgentBasicInfoProps {
  agentId: string
  agentName: LocalizedString
  description: LocalizedString
  prompt: string
  output: string
  tags: string[]
  selectedIcon: string
  isEditing: boolean
  onFieldChange: (
    field: string,
    value: string | string[] | LocalizedString
  ) => void
  templatePrompt: string
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  agentId,
  agentName,
  description,
  prompt,
  output,
  tags,
  selectedIcon,
  templatePrompt,
  isEditing,
  onFieldChange,
}) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [outputJsonError, setOutputJsonError] = useState<string | null>(null)
  const [outputValidationEnabled, setOutputValidationEnabled] = useState(false)
  const [generateJsonSchemaDialogVisible, setGenerateJsonSchemaDialogVisible] =
    useState(false)

  const tagOptions = useMemo(() => getAgentTagOptions(tags), [tags])

  const applyOutputValidation = useCallback(
    (value: string, showToast = false) => {
      const result = validateAgentOutputJsonSchema(value)
      if (result.valid) {
        setOutputJsonError(null)
        return true
      }

      const message = getAgentOutputValidationMessage(result, t)
      setOutputJsonError(message)
      if (showToast) {
        showError(message)
      }
      return false
    },
    [showError, t]
  )

  useEffect(() => {
    setOutputJsonError(null)
    if (output.trim()) {
      setOutputValidationEnabled(true)
    } else {
      setOutputValidationEnabled(false)
    }
  }, [agentId])

  useEffect(() => {
    if (!outputValidationEnabled) {
      return
    }

    const trimmed = output.trim()
    if (!trimmed) {
      setOutputJsonError(null)
      return
    }

    const timer = window.setTimeout(() => {
      applyOutputValidation(output)
    }, OUTPUT_VALIDATION_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [output, outputValidationEnabled, applyOutputValidation])

  const handleFormatOutputJson = useCallback(() => {
    const trimmed = output.trim()
    if (!trimmed) {
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      setOutputValidationEnabled(true)
      applyOutputValidation(trimmed, true)
      return
    }

    const formatted = JSON.stringify(parsed, null, 2)
    onFieldChange('output', formatted)
    setOutputValidationEnabled(true)
    applyOutputValidation(formatted, true)
  }, [applyOutputValidation, onFieldChange, output])

  const handleOutputChange = (value: string) => {
    onFieldChange('output', value)
    setOutputValidationEnabled(true)
    if (!value.trim()) {
      setOutputJsonError(null)
    }
  }

  const handleOutputBlur = () => {
    if (!output.trim()) {
      setOutputJsonError(null)
      return
    }

    setOutputValidationEnabled(true)
    applyOutputValidation(output)
  }

  const handleApplyGeneratedJsonSchema = useCallback(
    (formattedSchema: string) => {
      onFieldChange('output', formattedSchema)
      setOutputValidationEnabled(true)
      applyOutputValidation(formattedSchema)
    },
    [applyOutputValidation, onFieldChange]
  )

  const handleAgentIdChange = (value: string) => {
    const sanitized = sanitizeIdInput(value)
    onFieldChange('agentId', sanitized)
  }

  const hasTemplatePrompt = Boolean(templatePrompt)

  const idField = (
    <div className="form-field">
      <label className="field-label">
        {t('agent_id')}
        {!isEditing && <span className="field-required-mark"> *</span>}
      </label>
      <InputText
        value={agentId}
        onChange={(e) => handleAgentIdChange(e.target.value)}
        className={`w-full ${!isEditing && !agentId.trim() ? 'p-invalid' : ''}`}
        disabled={isEditing}
        placeholder={!isEditing ? t('enter_agent_id') : undefined}
        autoFocus={!isEditing}
      />
    </div>
  )

  const nameField = (
    <div className="form-field">
      <label className="field-label">
        {t('agent_name')}
        <span className="field-required-mark"> *</span>
      </label>
      <LocalizedInput
        value={agentName}
        onChange={(value) => onFieldChange('agentName', value)}
        placeholder={t('enter_agent_name')}
        invalid={!hasAnyLocalizedValue(agentName)}
      />
    </div>
  )

  const descriptionField = (
    <div className="form-field">
      <label className="field-label">
        {t('description')}
        <span className="field-required-mark"> *</span>
      </label>
      <LocalizedInput
        value={description}
        onChange={(value) => onFieldChange('description', value)}
        placeholder={t('enter_description')}
        invalid={!hasAnyLocalizedValue(description)}
        multiline
        rows={2}
      />
    </div>
  )

  const tagsField = (
    <div className="form-field agent-detail-tags-field">
      <label className="field-label">{t('tags')}</label>
      <MultiSelect
        value={tags}
        options={tagOptions}
        onChange={(e) => onFieldChange('tags', (e.value as string[]) ?? [])}
        className="w-full"
        display="chip"
        showClear
        maxSelectedLabels={3}
        placeholder={t('select_tags')}
        appendTo="self"
      />
    </div>
  )

  const iconField = (
    <div className="form-field agent-detail-icon-field">
      <label className="field-label">{t('icon')}</label>
      <button
        type="button"
        className="agent-detail-icon-btn"
        onClick={() => setShowIconPicker(true)}
        aria-label={t('select_icon')}
      >
        {selectedIcon && iconMap[selectedIcon] ? (
          <FontAwesomeIcon icon={iconMap[selectedIcon]} />
        ) : (
          <FontAwesomeIcon icon={faRobot} />
        )}
      </button>
    </div>
  )

  const templatePromptField = (
    <div className="form-field agent-detail-template-prompt-field">
      <label className="field-label">{t('template_prompt')}</label>
      <InputTextarea
        value={templatePrompt}
        rows={12}
        className="w-full readonly-textarea"
        readOnly
        placeholder={t('template_prompt_placeholder')}
      />
    </div>
  )

  const userPromptField = (
    <div className="form-field agent-detail-user-prompt-field">
      <label className="field-label">
        {t('user_prompt')}
        <span className="field-required-mark"> *</span>
      </label>
      <InputTextarea
        value={prompt}
        onChange={(e) => onFieldChange('prompt', e.target.value)}
        rows={12}
        className={`w-full ${!prompt.trim() ? 'p-invalid' : ''}`}
        placeholder={t('enter_prompt')}
      />
    </div>
  )

  const outputField = (
    <div className="form-field agent-detail-output-field">
      <label className="field-label">{t('output')}</label>
      <InputTextarea
        value={output}
        onChange={(e) => handleOutputChange(e.target.value)}
        onBlur={handleOutputBlur}
        rows={12}
        className={`w-full${outputJsonError ? ' p-invalid' : ''}`}
        placeholder={t('output_placeholder')}
        spellCheck={false}
      />
      {outputJsonError && <small className="p-error">{outputJsonError}</small>}
      <div className="agent-detail-output-actions">
        <Button
          type="button"
          className="p-button-outlined agent-detail-generate-json-schema-btn"
          onClick={() => setGenerateJsonSchemaDialogVisible(true)}
        >
          <span className="agent-detail-generate-json-schema-btn-content">
            <img
              src={starsIcon}
              alt=""
              className="agent-detail-generate-json-schema-btn-icon"
              aria-hidden="true"
            />
            <span className="p-button-label">{t('generate_json_schema')}</span>
          </span>
        </Button>
        <Button
          type="button"
          label={t('format_json_schema')}
          className="p-button-outlined agent-detail-format-json-btn"
          disabled={!output.trim()}
          onClick={handleFormatOutputJson}
        />
      </div>
    </div>
  )

  return (
    <div
      className={`agent-basic-info ${
        hasTemplatePrompt
          ? 'agent-basic-info--with-template'
          : 'agent-basic-info--single'
      }`}
    >
      <div className="agent-basic-info-fields">
        {idField}
        {nameField}
        {descriptionField}
        {tagsField}
        {iconField}
      </div>
      <div className="agent-basic-info-prompts">
        {hasTemplatePrompt && templatePromptField}
        {userPromptField}
        {outputField}
      </div>

      <IconPicker
        visible={showIconPicker}
        selectedIcon={selectedIcon}
        onIconSelect={(icon) => onFieldChange('selectedIcon', icon)}
        onClose={() => setShowIconPicker(false)}
      />

      <GenerateJsonSchemaDialog
        visible={generateJsonSchemaDialogVisible}
        onHide={() => setGenerateJsonSchemaDialogVisible(false)}
        onApply={handleApplyGeneratedJsonSchema}
      />
    </div>
  )
}
