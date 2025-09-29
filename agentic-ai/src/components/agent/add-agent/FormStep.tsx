import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';

interface FormStepProps {
  agentId: string;
  setAgentId: (value: string) => void;
  agentName: string;
  setAgentName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  onDiscard: () => void;
  onSave: () => void;
}

export const FormStep: React.FC<FormStepProps> = ({
  agentId,
  setAgentId,
  agentName,
  setAgentName,
  description,
  setDescription,
  onDiscard,
  onSave
}) => {
  const { t } = useTranslation();

  const isFormValid = agentId.trim() && agentName.trim() && description.trim();

  return (
    <div className="add-agent-form">
      {/* Agent Icon and Title Section */}
      <div className="add-agent-header">
        <div className="agent-icon">
          <FontAwesomeIcon icon={faHeadset} />
        </div>
        <h2 className="agent-title">{agentName || t('add_agent', 'Add Agent')}</h2>
        <p className="agent-subtitle">
          {t('customize_agent_description', 'Customize name and description to suit it better to your task.')}
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
            onChange={(e) => setAgentId(e.target.value)}
            className={`w-full ${!agentId.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_agent_id', 'Enter agent id')}
          />
          {!agentId.trim() && (
            <small className="p-error">{t('agent_id_required', 'Agent ID is required')}</small>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="agent-name" className="field-label">
            {t('agent_name', 'Agent Name')} <span style={{ color: 'red' }}>*</span>
          </label>
          <InputText
            id="agent-name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className={`w-full ${!agentName.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_agent_name', 'Enter agent name')}
          />
          {!agentName.trim() && (
            <small className="p-error">{t('agent_name_required', 'Agent name is required')}</small>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="agent-description" className="field-label">
            {t('description', 'Description')} <span style={{ color: 'red' }}>*</span>
          </label>
          <InputTextarea
            id="agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`w-full ${!description.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_description', 'Enter description')}
          />
          {!description.trim() && (
            <small className="p-error">{t('description_required', 'Description is required')}</small>
          )}
        </div>
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
  );
}; 