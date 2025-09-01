import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { LLM_PROVIDERS } from '../../utils/constants';
import { TokensService } from '../../services/tokensService';
import { Token } from '../../types/Token';
import { AppState } from '../../types/common';

interface LlmConfigSectionProps {
  model: string;
  temperature: string;
  maxTokens: string;
  provider: string;
  tokenId: string;
  recursionLimit: string;
  enableMemory: boolean;
  isEditing: boolean;
  appState: AppState;
  onFieldChange: (field: string, value: string | boolean) => void;
}

export const LlmConfigSection: React.FC<LlmConfigSectionProps> = ({
  model,
  temperature,
  maxTokens,
  provider,
  tokenId,
  recursionLimit,
  enableMemory,
  isEditing,
  appState,
  onFieldChange
}) => {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  useEffect(() => {
    const loadTokens = async () => {
      if (provider !== 'emporix_openai') {
        setTokensLoading(true);
        try {
          const tokensService = new TokensService(appState);
          const fetchedTokens = await tokensService.getTokens();
          setTokens(fetchedTokens);
        } catch (error) {
          console.error('Error loading tokens:', error);
          setTokens([]);
        } finally {
          setTokensLoading(false);
        }
      }
    };

    loadTokens();
  }, [provider, appState]);

  const tokenOptions = tokens.map(token => ({
    label: token.name,
    value: token.id
  }));

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
              {t('token', 'Token')} 
              {!isEditing && <span style={{ color: 'red' }}> *</span>}
            </label>
            <Dropdown 
              value={tokenId} 
              options={tokenOptions} 
              onChange={e => onFieldChange('tokenId', e.value)} 
              className={`w-full ${!isEditing && !tokenId.trim() ? 'p-invalid' : ''}`}
              placeholder={tokensLoading ? t('loading_tokens', 'Loading tokens...') : t('select_token', 'Select token')}
              disabled={tokensLoading}
            />
            {!isEditing && !tokenId.trim() && (
              <small className="p-error">{t('token_required', 'Token is required')}</small>
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