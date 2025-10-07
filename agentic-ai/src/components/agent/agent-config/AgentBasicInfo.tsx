import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { TRIGGER_TYPES } from '../../../utils/constants';
import { AppState } from '../../../types/common';
import { useCommerceEvents } from '../../../hooks/useCommerceEvents';

interface AgentBasicInfoProps {
  agentId: string;
  agentName: string;
  description: string;
  agentType: string;
  triggerTypes: string[];
  prompt: string;
  commerceEvents: string[];
  isEditing: boolean;
  onFieldChange: (field: string, value: string | string[]) => void;
  appState: AppState;
  templatePrompt: string;
  requiredScopes: string[];
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  agentId,
  agentName,
  description,
  agentType,
  triggerTypes,
  prompt,
  commerceEvents,
  templatePrompt,
  requiredScopes,
  isEditing,
  onFieldChange,
  appState
}) => {
  const { t } = useTranslation();
  const { events: availableEvents, loading: eventsLoading, error: eventsError } = useCommerceEvents(appState);

  // Transform events for MultiSelect options
  const eventOptions = availableEvents.map(event => ({ label: event, value: event }));

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
        <label className="field-label">
          {t('agent_id', 'ID')} 
          {!isEditing && <span style={{ color: 'red' }}> *</span>}
        </label>
        <InputText 
          value={agentId} 
          onChange={e => onFieldChange('agentId', e.target.value)} 
          className={`w-full ${!isEditing && !agentId.trim() ? 'p-invalid' : ''}`}
          disabled={isEditing}
          placeholder={!isEditing ? t('enter_agent_id', 'Enter agent ID') : undefined}
        />
        {!isEditing && !agentId.trim() && (
          <small className="p-error">{t('agent_id_required', 'Agent ID is required')}</small>
        )}
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
        <label className="field-label">{t('trigger_types', 'Trigger Types')}</label>
        <MultiSelect 
          value={triggerTypes} 
          options={availableTriggerTypes} 
          onChange={e => onFieldChange('triggerTypes', e.value)} 
          className="w-full" 
          display="chip"
          placeholder={t('select_trigger_types', 'Select trigger types')}
          appendTo="self"
          disabled={agentType === 'support'}
        />
      </div>

      {triggerTypes.includes('commerce_events') && (
        <div className="form-field">
          <label className="field-label">
            {t('commerce_events', 'Commerce Events')} *
          </label>
          <MultiSelect
            value={commerceEvents}
            options={eventOptions}
            onChange={e => onFieldChange('commerceEvents', e.value)}
            className={`w-full ${!commerceEvents || commerceEvents.length === 0 ? 'p-invalid' : ''}`}
            placeholder={eventsLoading ? t('loading_events', 'Loading events...') : t('select_events_placeholder', 'Choose events to trigger this agent')}
            disabled={eventsLoading}
            showClear
            display="chip"
            maxSelectedLabels={3}
          />
          {eventsError && (
            <small className="p-error">{eventsError}</small>
          )}
          {(!commerceEvents || commerceEvents.length === 0) && !eventsLoading && !eventsError && (
            <small className="p-error">{t('commerce_events_required', 'At least one commerce event is required')}</small>
          )}
        </div>
      )}
      
      {templatePrompt && (
        <div className="form-field">
          <label className="field-label">{t('template_prompt', 'Template Prompt')}</label>
          <InputTextarea 
            value={templatePrompt} 
            rows={15} 
            className="w-full readonly-textarea"
            readOnly
            placeholder={t('template_prompt_placeholder', 'Template prompt from agent template')}
          />
        </div>
      )}
      
      <div className="form-field">
        <label className="field-label">{t('user_prompt', 'User Prompt')} *</label>
        <InputTextarea 
          value={prompt} 
          onChange={e => onFieldChange('prompt', e.target.value)} 
          rows={15} 
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