import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { TRIGGER_TYPES } from '../../../utils/constants';

interface AgentBasicInfoProps {
  agentId: string;
  agentName: string;
  description: string;
  agentType: string;
  triggerType: string;
  prompt: string;
  requiredScopes: string[];
  isEditing: boolean;
  onFieldChange: (field: string, value: string | string[]) => void;
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  agentId,
  agentName,
  description,
  agentType,
  triggerType,
  prompt,
  requiredScopes,
  isEditing,
  onFieldChange
}) => {
  const { t } = useTranslation();

  const scopeOptions = [
    { label: 'Anonymous', value: 'anonymous' },
    { label: 'Customer', value: 'customer' },
    { label: 'Employee', value: 'employee' },
    { label: 'Integration', value: 'integration' }
  ];

  // Filter trigger types based on agent type
  const availableTriggerTypes = agentType === 'support' 
    ? TRIGGER_TYPES.filter(option => option.value === 'slack')
    : TRIGGER_TYPES.filter(option => option.value !== 'slack');

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
        <label className="field-label">{t('required_scopes', 'Required Scopes')}</label>
        <MultiSelect 
          value={requiredScopes} 
          options={scopeOptions}
          onChange={e => onFieldChange('requiredScopes', e.value)} 
          className="w-full" 
          display="chip"
          placeholder={t('select_required_scopes', 'Select required scopes')}
          appendTo="self"
        />
      </div>
      
      <div className="form-field">
        <label className="field-label">{t('trigger_type', 'Trigger Type')}</label>
        <Dropdown 
          value={triggerType} 
          options={availableTriggerTypes} 
          onChange={e => onFieldChange('triggerType', e.value)} 
          className="w-full" 
          optionDisabled="disabled"
          appendTo="self"
          disabled={agentType === 'support'}
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