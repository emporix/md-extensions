import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { LLM_PROVIDERS } from '../../utils/constants';

interface LlmConfigSectionProps {
  model: string;
  temperature: string;
  maxTokens: string;
  provider: string;
  apiKey: string;
  recursionLimit: string;
  enableMemory: boolean;
  isEditing: boolean;
  onFieldChange: (field: string, value: string | boolean) => void;
}

export const LlmConfigSection: React.FC<LlmConfigSectionProps> = ({
  model,
  temperature,
  maxTokens,
  provider,
  apiKey,
  recursionLimit,
  enableMemory,
  isEditing,
  onFieldChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="llm-config-section">
      <h2 className="llm-config-title">{t('llm_config', 'LLM Configuration')}</h2>
      <div className="llm-config-grid">
        <div className="form-field">
          <label className="field-label">{t('provider', 'Provider')}</label>
          <Dropdown 
            value={provider} 
            options={LLM_PROVIDERS} 
            onChange={e => onFieldChange('provider', e.value)} 
            className="w-full" 
          />
        </div>
        <div className="form-field">
          <label className="field-label">{t('model', 'Model')} *</label>
          <InputText 
            value={model} 
            onChange={e => onFieldChange('model', e.target.value)} 
            className={`w-full ${!model.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_model', 'Enter model name')}
          />
          {!model.trim() && (
            <small className="p-error">{t('model_required', 'Model is required')}</small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">{t('temperature', 'Temperature')}</label>
          <InputText 
            value={temperature} 
            onChange={e => onFieldChange('temperature', e.target.value)} 
            className="w-full" 
          />
        </div>
        <div className="form-field">
          <label className="field-label">{t('max_tokens', 'Max Tokens')}</label>
          <InputText 
            value={maxTokens} 
            onChange={e => onFieldChange('maxTokens', e.target.value)} 
            className="w-full" 
          />
        </div>
        {provider !== 'emporix_openai' && (
          <div className="form-field">
            <label className="field-label">
              {t('api_key', 'API Key')} 
              {!isEditing && <span style={{ color: 'red' }}> *</span>}
            </label>
            <InputText 
              value={apiKey} 
              onChange={e => onFieldChange('apiKey', e.target.value)} 
              className={`w-full ${!isEditing && !apiKey.trim() ? 'p-invalid' : ''}`}
              placeholder={t('enter_api_key', 'Enter API key')}
            />
            {!isEditing && !apiKey.trim() && (
              <small className="p-error">{t('api_key_required', 'API key is required')}</small>
            )}
          </div>
        )}
      </div>
      <div className="llm-config-row">
        <div className="form-field" style={{ flex: 1 }}>
          <label className="field-label">{t('recursion_limit', 'Recursion Limit')}</label>
          <InputText 
            value={recursionLimit} 
            onChange={e => onFieldChange('recursionLimit', e.target.value)} 
            className="w-full" 
          />
        </div>
        <div className="form-field" style={{ display: 'flex', alignItems: 'center', marginLeft: '2rem', marginTop: '2rem' }}>
          <InputSwitch 
            checked={enableMemory} 
            onChange={e => onFieldChange('enableMemory', e.value)} 
          />
          <span style={{ marginLeft: '0.75rem', fontWeight: 500, color: '#374151' }}>
            {t('enable_memory', 'Enable Memory')}
          </span>
        </div>
      </div>
    </div>
  );
}; 