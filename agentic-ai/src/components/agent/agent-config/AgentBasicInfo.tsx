import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { LocalizedString } from '../../../types/Agent'
import { LocalizedInput } from '../../shared/LocalizedInput'
import { hasAnyLocalizedValue } from '../../../utils/agentHelpers'
import { sanitizeIdInput } from '../../../utils/validation'

interface AgentBasicInfoProps {
  agentId: string
  agentName: LocalizedString
  description: LocalizedString
  prompt: string
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
  templatePrompt,
  isEditing,
  onFieldChange,
}) => {
  const { t } = useTranslation()

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
      </div>
      <div className="agent-basic-info-prompts">
        {hasTemplatePrompt && templatePromptField}
        {userPromptField}
      </div>
    </div>
  )
}
