import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { TRIGGER_TYPES } from '../../../utils/constants';

interface AgentBasicInfoProps {
  agentId: string;
  agentName: string;
  description: string;
  triggerType: string;
  prompt: string;
  isEditing: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  agentId,
  agentName,
  description,
  triggerType,
  prompt,
  isEditing,
  onFieldChange
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="form-field">
        <label className="field-label">{t('agent_id', 'ID')}</label>
        <InputText 
          value={agentId} 
          onChange={e => onFieldChange('agentId', e.target.value)} 
          className="w-full" 
          disabled={isEditing}
        />
      </div>
      
      <div className="form-field">
        <label className="field-label">{t('agent_name', 'Agent Name')} *</label>
        <InputText 
          value={agentName} 
          onChange={e => onFieldChange('agentName', e.target.value)} 
          className={`w-full ${!agentName.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_agent_name', 'Enter agent name')}
        />
        {!agentName.trim() && (
          <small className="p-error">{t('agent_name_required', 'Agent name is required')}</small>
        )}
      </div>
      
      <div className="form-field">
        <label className="field-label">{t('description', 'Description')} *</label>
        <InputTextarea 
          value={description} 
          onChange={e => onFieldChange('description', e.target.value)} 
          rows={3} 
          className={`w-full ${!description.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_description', 'Enter description')}
        />
        {!description.trim() && (
          <small className="p-error">{t('description_required', 'Description is required')}</small>
        )}
      </div>
      
      <div className="form-field">
        <label className="field-label">{t('trigger_type', 'Trigger Type')}</label>
        <Dropdown 
          value={triggerType} 
          options={TRIGGER_TYPES} 
          onChange={e => onFieldChange('triggerType', e.value)} 
          className="w-full" 
          optionDisabled="disabled"
        />
      </div>
      
      <div className="form-field">
        <label className="field-label">{t('prompt', 'Prompt')} *</label>
        <InputTextarea 
          value={prompt} 
          onChange={e => onFieldChange('prompt', e.target.value)} 
          rows={3} 
          className={`w-full ${!prompt.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_prompt', 'Enter prompt')}
        />
        {!prompt.trim() && (
          <small className="p-error">{t('prompt_required', 'Prompt is required')}</small>
        )}
      </div>
    </>
  );
}; 