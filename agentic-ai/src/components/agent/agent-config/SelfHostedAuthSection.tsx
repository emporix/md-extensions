import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { Token } from '../../../types/Token'
import { OAuth } from '../../../types/OAuth'
import { getOAuthDisplayName } from '../../../utils/oauthHelpers'

interface SelfHostedAuthSectionProps {
  oauthFeatureEnabled?: boolean
  useOAuth: boolean
  authHeaderName: string
  authHeaderTokenId: string
  oauthId: string
  tokens: Token[]
  tokensLoading: boolean
  oauths: OAuth[]
  oauthsLoading: boolean
  showValidation?: boolean
  onFieldChange: (field: string, value: string | boolean) => void
}

export const SelfHostedAuthSection: React.FC<SelfHostedAuthSectionProps> = ({
  oauthFeatureEnabled = false,
  useOAuth,
  authHeaderName,
  authHeaderTokenId,
  oauthId,
  tokens,
  tokensLoading,
  oauths,
  oauthsLoading,
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

  const oauthOptions = useMemo(
    () =>
      oauths
        .filter(
          (oauth) => oauth.enabled !== false || oauth.id === oauthId
        )
        .map((oauth) => ({
          label: getOAuthDisplayName(oauth),
          value: oauth.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [oauthId, oauths]
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
        <div className="form-field">
          <label className="field-label">
            {t('oauth')}
            <span className="agent-detail-required"> *</span>
          </label>
          <Dropdown
            value={oauthId || null}
            options={oauthOptions}
            onChange={(event) =>
              onFieldChange('oauthId', event.value ?? '')
            }
            className={`w-full${showValidation && !oauthId.trim() ? ' p-invalid' : ''}`}
            placeholder={
              oauthsLoading ? t('loading_oauths') : t('select_oauth')
            }
            disabled={oauthsLoading}
            showClear
            appendTo="self"
          />
        </div>
      )}
    </>
  )
}
