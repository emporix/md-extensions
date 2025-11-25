import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { LLM_PROVIDERS } from '../../../utils/constants'
import { TokensService } from '../../../services/tokensService'
import { Token } from '../../../types/Token'
import { AppState } from '../../../types/common'

interface LlmConfigSectionProps {
  model: string
  temperature: string
  maxTokens: string
  provider: string
  tokenId: string
  recursionLimit: string
  enableMemory: boolean
  isEditing: boolean
  appState: AppState
  onFieldChange: (field: string, value: string | boolean) => void
  // Self-hosted LLM parameters
  selfHostedUrl?: string
  selfHostedAuthHeaderName?: string
  selfHostedTokenId?: string
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
  onFieldChange,
  selfHostedUrl = '',
  selfHostedAuthHeaderName = '',
  selfHostedTokenId = '',
}) => {
  const { t } = useTranslation()
  const [tokens, setTokens] = useState<Token[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)

  useEffect(() => {
    const loadTokens = async () => {
      // Load tokens for:
      // 1. Regular providers (openai, google, anthropic) - for main token field
      // 2. Self-hosted providers - for optional authorization token
      if (provider !== 'emporix_openai') {
        setTokensLoading(true)
        try {
          const tokensService = new TokensService(appState)
          const fetchedTokens = await tokensService.getTokens()
          setTokens(fetchedTokens)
        } catch (error) {
          console.error(error)
          setTokens([])
        } finally {
          setTokensLoading(false)
        }
      }
    }

    loadTokens()
  }, [provider, appState])

  const tokenOptions = tokens
    .map((token) => ({
      label: token.name,
      value: token.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="llm-config-section">
      <h2 className="llm-config-title">
        {t('llm_config', 'LLM Configuration')}
      </h2>
      <div className="llm-config-grid">
        <div className="form-field">
          <label className="field-label">{t('provider', 'Provider')}</label>
          <Dropdown
            value={provider}
            options={LLM_PROVIDERS}
            onChange={(e) => onFieldChange('provider', e.value)}
            className="w-full"
            appendTo="self"
          />
        </div>
        <div className="form-field">
          <label className="field-label">{t('model', 'Model')} *</label>
          <InputText
            value={model}
            onChange={(e) => onFieldChange('model', e.target.value)}
            className={`w-full ${!model.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_model', 'Enter model name')}
          />
          {!model.trim() && (
            <small className="p-error">
              {t('model_required', 'Model is required')}
            </small>
          )}
        </div>
        <div className="form-field">
          <label className="field-label">
            {t('temperature', 'Temperature')}
          </label>
          <div className="temperature-slider">
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={Math.round(parseFloat(temperature || '0.5') * 10)}
                onChange={(e) => {
                  const sliderValue = parseInt(e.target.value) / 10
                  onFieldChange('temperature', sliderValue.toString())
                }}
                className="w-full"
                title={temperature}
              />
              <div
                className="slider-tooltip"
                style={{
                  left: `calc(${((parseFloat(temperature || '0.5') * 10) / 10) * 100}% - 15px)`,
                }}
              >
                {temperature}
              </div>
            </div>
            <div className="temperature-labels">
              <span>0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
        <div className="form-field">
          <label className="field-label">{t('max_tokens', 'Max Tokens')}</label>
          <InputText
            value={maxTokens}
            onChange={(e) => onFieldChange('maxTokens', e.target.value)}
            className="w-full"
          />
        </div>
        {provider !== 'emporix_openai' && provider !== 'self_hosted_ollama' && (
          <div className="form-field">
            <label className="field-label">
              {t('token', 'Token')}
              {!isEditing && <span style={{ color: 'red' }}> *</span>}
            </label>
            <Dropdown
              value={tokenId}
              options={tokenOptions}
              onChange={(e) => onFieldChange('tokenId', e.value)}
              className={`w-full ${!isEditing && !tokenId.trim() ? 'p-invalid' : ''}`}
              placeholder={
                tokensLoading
                  ? t('loading_tokens', 'Loading tokens...')
                  : t('select_token', 'Select token')
              }
              disabled={tokensLoading}
              appendTo="self"
            />
            {!isEditing && !tokenId.trim() && (
              <small className="p-error">
                {t('token_required', 'Token is required')}
              </small>
            )}
          </div>
        )}

        {provider === 'self_hosted_ollama' && (
          <>
            <div className="form-field">
              <label className="field-label">
                {t('self_hosted_url', 'Self-hosted URL')}
                {!isEditing && <span style={{ color: 'red' }}> *</span>}
              </label>
              <InputText
                value={selfHostedUrl}
                onChange={(e) => onFieldChange('selfHostedUrl', e.target.value)}
                className={`w-full ${!isEditing && !selfHostedUrl.trim() ? 'p-invalid' : ''}`}
                placeholder={t(
                  'enter_self_hosted_url',
                  'Enter self-hosted URL'
                )}
              />
              {!isEditing && !selfHostedUrl.trim() && (
                <small className="p-error">
                  {t('self_hosted_url_required', 'Self-hosted URL is required')}
                </small>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                {t('authorization_header_name', 'Authorization Header Name')} (
                {t('optional', 'Optional')})
              </label>
              <InputText
                value={selfHostedAuthHeaderName}
                onChange={(e) =>
                  onFieldChange('selfHostedAuthHeaderName', e.target.value)
                }
                className="w-full"
                placeholder={t(
                  'enter_authorization_header_name',
                  'Enter authorization header name'
                )}
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                {t('authorization_token', 'Authorization Token')} (
                {t('optional', 'Optional')})
              </label>
              <Dropdown
                value={selfHostedTokenId}
                options={tokenOptions}
                onChange={(e) => onFieldChange('selfHostedTokenId', e.value)}
                className="w-full"
                placeholder={
                  tokensLoading
                    ? t('loading_tokens', 'Loading tokens...')
                    : t('select_token', 'Select token')
                }
                disabled={tokensLoading}
                showClear
                appendTo="self"
              />
            </div>
          </>
        )}
      </div>
      <div className="llm-config-row">
        <div className="form-field" style={{ flex: 1 }}>
          <label className="field-label">
            {t('recursion_limit', 'Recursion Limit')}
          </label>
          <div className="recursion-limit-slider">
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={recursionLimit}
                onChange={(e) =>
                  onFieldChange('recursionLimit', e.target.value)
                }
                className="w-full"
                title={recursionLimit}
              />
              <div
                className="slider-tooltip"
                style={{
                  left: `calc(${((parseInt(recursionLimit) - 1) / 99) * 100}% - 15px)`,
                }}
              >
                {recursionLimit}
              </div>
            </div>
            <div className="recursion-limit-labels">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="field-label">
            {t('enable_memory', 'Enable Memory')}
          </label>
          <div style={{ marginTop: '0.5rem' }}>
            <InputSwitch
              checked={enableMemory}
              onChange={(e) => onFieldChange('enableMemory', e.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
