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
      <div className="add-agent-header">
        <div className="agent-icon">
          <FontAwesomeIcon icon={faHeadset} />
        </div>
        <h2 className="agent-title">
          {getLocalizedValue(agentName, appState.contentLanguage) ||
            t('add_agent')}
        </h2>
        <p className="agent-subtitle">{t('customize_agent_subtitle')}</p>
      </div>

      <div className="form-fields-section">
        <div className="form-field">
          <label htmlFor="agent-id" className="field-label">
            {t('agent_id')} <span className="field-required-mark">*</span>
          </label>
          <InputText
            id="agent-id"
            value={agentId}
            onChange={(e) => handleAgentIdChange(e.target.value)}
            className={`w-full ${!agentId.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_agent_id')}
          />
        </div>
        <div className="form-field">
          <label htmlFor="agent-name" className="field-label">
            {t('agent_name')} <span className="field-required-mark">*</span>
          </label>
          <LocalizedInput
            value={agentName}
            onChange={(value) => setAgentName(value)}
            appState={appState}
            placeholder={t('enter_agent_name')}
            invalid={!hasAnyLocalizedValue(agentName)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="agent-description" className="field-label">
            {t('description')} <span className="field-required-mark">*</span>
          </label>
          <LocalizedInput
            value={description}
            onChange={(value) => setDescription(value)}
            appState={appState}
            placeholder={t('enter_description')}
            invalid={!hasAnyLocalizedValue(description)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="user-prompt" className="field-label">
            {t('user_prompt')} <span className="field-required-mark">*</span>
          </label>
          <InputTextarea
            id="user-prompt"
            value={userPrompt}
            rows={4}
            onChange={(e) => setUserPrompt(e.target.value)}
            className={`w-full ${!userPrompt.trim() ? 'p-invalid' : ''}`}
            placeholder={t('user_prompt_placeholder')}
          />
        </div>
        {templatePrompt && (
          <div className="form-field">
            <label htmlFor="template-prompt" className="field-label">
              {t('template_prompt')}
            </label>
            <InputTextarea
              id="template-prompt"
              value={templatePrompt}
              readOnly
              rows={4}
              className="w-full readonly-textarea"
              placeholder={t('template_prompt_placeholder')}
            />
          </div>
        )}
      </div>

      <div className="dialog-actions">
        <Button
          type="button"
          label={t('discard')}
          onClick={onDiscard}
          className="p-button-secondary"
        />
        <Button
          type="button"
          label={t('save_agent')}
          onClick={onSave}
          disabled={!isFormValid}
        />
      </div>
    </div>
  )
}
