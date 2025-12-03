import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeadset } from '@fortawesome/free-solid-svg-icons'
import { LocalizedString } from '../../../types/Agent'
import { AppState } from '../../../types/common'
import {
  getLocalizedValue,
  hasAnyLocalizedValue,
} from '../../../utils/agentHelpers'
import { LocalizedInput } from '../../shared/LocalizedInput'
import { sanitizeIdInput } from '../../../utils/validation'

interface FormStepProps {
  agentId: string
  setAgentId: (value: string) => void
  agentName: LocalizedString
  setAgentName: (value: LocalizedString) => void
  description: LocalizedString
  setDescription: (value: LocalizedString) => void
  setUserPrompt: (value: string) => void
  userPrompt: string
  templatePrompt: string
  onDiscard: () => void
  onSave: () => void
  appState: AppState
}

export const FormStep: React.FC<FormStepProps> = ({
  agentId,
  setAgentId,
  agentName,
  setAgentName,
  description,
  setDescription,
  setUserPrompt,
  userPrompt,
  templatePrompt,
  onDiscard,
  onSave,
  appState,
}) => {
  const { t } = useTranslation()

  const handleAgentIdChange = (value: string) => {
    const sanitized = sanitizeIdInput(value)
    setAgentId(sanitized)
  }

  const isFormValid =
    agentId.trim() &&
    hasAnyLocalizedValue(agentName) &&
    hasAnyLocalizedValue(description) &&
    userPrompt?.trim()

  return (
    <div className="add-agent-form">
      {/* Agent Icon and Title Section */}
      <div className="add-agent-header">
        <div className="agent-icon">
          <FontAwesomeIcon icon={faHeadset} />
        </div>
        <h2 className="agent-title">
          {getLocalizedValue(agentName, appState.contentLanguage) ||
            t('add_agent', 'Add Agent')}
        </h2>
        <p className="agent-subtitle">
          {t(
            'customize_agent_description',
            'Customize name and description to suit it better to your task.'
          )}
        </p>
      </div>

      {/* Form Fields */}
      <div className="form-fields-section">
        <div className="form-field">
          <label htmlFor="agent-id" className="field-label">
            {t('agent_id', 'ID')} <span style={{ color: 'red' }}>*</span>
          </label>
          <InputText
            id="agent-id"
            value={agentId}
            onChange={(e) => handleAgentIdChange(e.target.value)}
            className={`w-full ${!agentId.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_agent_id', 'Enter agent id')}
          />
          {!agentId.trim() && (
            <small className="p-error">
              {t('agent_id_required', 'Agent ID is required')}
            </small>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="agent-name" className="field-label">
            {t('agent_name', 'Agent Name')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </label>
          <LocalizedInput
            value={agentName}
            onChange={(value) => setAgentName(value)}
            appState={appState}
            placeholder={t('enter_agent_name', 'Enter agent name')}
            error={
              !hasAnyLocalizedValue(agentName)
                ? t('agent_name_required', 'Agent name is required')
                : undefined
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="agent-description" className="field-label">
            {t('description', 'Description')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </label>
          <LocalizedInput
            value={description}
            onChange={(value) => setDescription(value)}
            appState={appState}
            placeholder={t('enter_description', 'Enter description')}
            error={
              !hasAnyLocalizedValue(description)
                ? t('description_required', 'Description is required')
                : undefined
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="user-prompt" className="field-label">
            {t('user_prompt', 'User Prompt')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </label>
          <InputTextarea
            id="user-prompt"
            value={userPrompt}
            rows={4}
            onChange={(e) => setUserPrompt(e.target.value)}
            className={`w-full ${!userPrompt.trim() ? 'p-invalid' : ''}`}
            placeholder={t(
              'user_prompt_placeholder',
              'User prompt will appear here'
            )}
          />
          {!userPrompt.trim() && (
            <small className="p-error">
              {t('user_prompt_required', 'User prompt is required')}
            </small>
          )}
        </div>
        {templatePrompt && (
          <div className="form-field">
            <label htmlFor="template-prompt" className="field-label">
              {t('template_prompt', 'Template Prompt')}
            </label>
            <InputTextarea
              id="template-prompt"
              value={templatePrompt}
              readOnly
              rows={4}
              className="w-full readonly-textarea"
              placeholder={t(
                'template_prompt_placeholder',
                'Template prompt will appear here'
              )}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="dialog-actions">
        <Button
          label={t('discard', 'DISCARD')}
          onClick={onDiscard}
          className="discard-button"
        />
        <Button
          label={t('save_agent', 'SAVE AGENT')}
          onClick={onSave}
          disabled={!isFormValid}
          className="save-agent-button"
        />
      </div>
    </div>
  )
}
