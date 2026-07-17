import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { GrantType } from '../../../types/Agent'
import { Token } from '../../../types/Token'

interface SelfHostedAuthSectionProps {
  oauthFeatureEnabled?: boolean
  useOAuth: boolean
  authHeaderName: string
  authHeaderTokenId: string
  oauthUrl: string
  oauthClientId: string
  oauthClientSecretTokenId: string
  oauthGrantType: GrantType | ''
  oauthScope: string
  tokens: Token[]
  tokensLoading: boolean
  showValidation?: boolean
  onFieldChange: (field: string, value: string | boolean) => void
}

export const SelfHostedAuthSection: React.FC<SelfHostedAuthSectionProps> = ({
  oauthFeatureEnabled = false,
  useOAuth,
  authHeaderName,
  authHeaderTokenId,
  oauthUrl,
  oauthClientId,
  oauthClientSecretTokenId,
  oauthGrantType,
  oauthScope,
  tokens,
  tokensLoading,
  showValidation = false,
  onFieldChange,
}) => {
  const { t } = useTranslation()

  const tokenOptions = useMemo(
    () =>
      tokens
        .map((token) => ({
          label: token.name,
          value: token.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [tokens]
  )

  const grantTypeOptions = useMemo(
    () => [
      {
        label: t('grant_type_client_credentials'),
        value: GrantType.CLIENT_CREDENTIALS,
      },
    ],
    [t]
  )

  const showOAuthFields = oauthFeatureEnabled && useOAuth

  return (
    <>
      {oauthFeatureEnabled ? (
        <div className="form-field agent-detail-model-memory-field agent-detail-self-hosted-auth-toggle">
          <div className="agent-detail-model-memory-switch">
            <InputSwitch
              inputId="self-hosted-use-oauth"
              checked={useOAuth}
              onChange={(event) =>
                onFieldChange('selfHostedUseOAuth', event.value)
              }
            />
            <label
              className="field-label agent-detail-model-memory-label"
              htmlFor="self-hosted-use-oauth"
            >
              {t('use_oauth_authentication')}
            </label>
          </div>
        </div>
      ) : null}

      {!showOAuthFields ? (
        <>
          <div className="form-field">
            <label className="field-label">
              {t('authorization_header_name')} ({t('optional')})
            </label>
            <InputText
              value={authHeaderName}
              onChange={(event) =>
                onFieldChange('selfHostedAuthHeaderName', event.target.value)
              }
              className="w-full"
              placeholder={t('enter_authorization_header_name')}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('authorization_token')} ({t('optional')})
            </label>
            <Dropdown
              value={authHeaderTokenId || null}
              options={tokenOptions}
              onChange={(event) =>
                onFieldChange('selfHostedTokenId', event.value ?? '')
              }
              className="w-full"
              placeholder={
                tokensLoading ? t('loading_tokens') : t('select_token')
              }
              disabled={tokensLoading}
              showClear
              appendTo="self"
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-field">
            <label className="field-label">
              {t('oauth_url')}
              <span className="agent-detail-required"> *</span>
            </label>
            <InputText
              value={oauthUrl}
              onChange={(event) =>
                onFieldChange('oauthUrl', event.target.value)
              }
              className={`w-full${showValidation && !oauthUrl.trim() ? ' p-invalid' : ''}`}
              placeholder={t('enter_oauth_url')}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('oauth_client_id')}
              <span className="agent-detail-required"> *</span>
            </label>
            <InputText
              value={oauthClientId}
              onChange={(event) =>
                onFieldChange('oauthClientId', event.target.value)
              }
              className={`w-full${showValidation && !oauthClientId.trim() ? ' p-invalid' : ''}`}
              placeholder={t('enter_oauth_client_id')}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('oauth_client_secret')} ({t('optional')})
            </label>
            <Dropdown
              value={oauthClientSecretTokenId || null}
              options={tokenOptions}
              onChange={(event) =>
                onFieldChange('oauthClientSecretTokenId', event.value ?? '')
              }
              className="w-full"
              placeholder={
                tokensLoading ? t('loading_tokens') : t('select_token')
              }
              disabled={tokensLoading}
              showClear
              appendTo="self"
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('oauth_grant_type')}
              <span className="agent-detail-required"> *</span>
            </label>
            <Dropdown
              value={oauthGrantType || null}
              options={grantTypeOptions}
              onChange={(event) =>
                onFieldChange('oauthGrantType', event.value ?? '')
              }
              className={`w-full${showValidation && !oauthGrantType ? ' p-invalid' : ''}`}
              placeholder={t('select_oauth_grant_type')}
              appendTo="self"
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('oauth_scope')} ({t('optional')})
            </label>
            <InputText
              value={oauthScope}
              onChange={(event) =>
                onFieldChange('oauthScope', event.target.value)
              }
              className="w-full"
              placeholder={t('enter_oauth_scope')}
            />
          </div>
        </>
      )}
    </>
  )
}
