import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { GrantType } from '../../types/Agent'
import { CodeChallengeMethod } from '../../types/OAuth'
import { Token } from '../../types/Token'
import type { OAuthConfigField } from '../../hooks/useOAuthConfig'
import {
  getCodeChallengeMethodLabel,
  getOAuthStatusLabel,
} from '../../utils/oauthHelpers'
import { OAuthRequiredMark } from './OAuthRequiredMark'
import { McpAuthTokenSelect } from '../mcp/McpAuthTokenSelect'

interface OAuthGeneralSectionProps {
  oauthId: string
  tokenUrl: string
  authorizationUrl: string
  clientId: string
  grantType: GrantType | ''
  scope: string
  clientSecretTokenId: string
  codeChallengeMethod: CodeChallengeMethod | ''
  status: string
  enabled: boolean
  isEditing: boolean
  tokens: Token[]
  tokensLoading: boolean
  onFieldChange: (
    field: OAuthConfigField,
    value: string | boolean | GrantType | CodeChallengeMethod
  ) => void
}

export const OAuthGeneralSection: React.FC<OAuthGeneralSectionProps> = ({
  oauthId,
  tokenUrl,
  authorizationUrl,
  clientId,
  grantType,
  scope,
  clientSecretTokenId,
  codeChallengeMethod,
  status,
  enabled,
  isEditing,
  tokens,
  tokensLoading,
  onFieldChange,
}) => {
  const { t } = useTranslation()
  const isAuthorizationCode = grantType === GrantType.AUTHORIZATION_CODE

  const grantTypeOptions = useMemo(
    () => [
      {
        label: t('grant_type_client_credentials'),
        value: GrantType.CLIENT_CREDENTIALS,
      },
      {
        label: t('grant_type_authorization_code'),
        value: GrantType.AUTHORIZATION_CODE,
      },
    ],
    [t]
  )

  const codeChallengeMethodOptions = useMemo(
    () => [
      {
        label: getCodeChallengeMethodLabel(t, CodeChallengeMethod.S256),
        value: CodeChallengeMethod.S256,
      },
    ],
    [t]
  )

  return (
    <>
      <div className="oauth-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('oauth_id')}
            {!isEditing && <OAuthRequiredMark />}
          </label>
          <InputText
            value={oauthId}
            onChange={(event) => onFieldChange('oauthId', event.target.value)}
            className={`w-full${!isEditing && !oauthId.trim() ? ' p-invalid' : ''}`}
            disabled={isEditing}
            placeholder={t('enter_oauth_id')}
            autoFocus={!isEditing}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('oauth_client_id')}
            <OAuthRequiredMark />
          </label>
          <InputText
            value={clientId}
            onChange={(event) => onFieldChange('clientId', event.target.value)}
            className={`w-full${!clientId.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_oauth_client_id')}
          />
        </div>
      </div>

      <div className="oauth-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('oauth_grant_type')}
            <OAuthRequiredMark />
          </label>
          <Dropdown
            value={grantType || null}
            options={grantTypeOptions}
            onChange={(event) => onFieldChange('grantType', event.value ?? '')}
            className={`w-full${!grantType ? ' p-invalid' : ''}`}
            placeholder={t('select_oauth_grant_type')}
            appendTo="self"
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('oauth_scope')} ({t('optional')})
          </label>
          <InputText
            value={scope}
            onChange={(event) => onFieldChange('scope', event.target.value)}
            className="w-full"
            placeholder={t('enter_oauth_scope')}
          />
        </div>
      </div>

      {isAuthorizationCode && (
        <div className="form-field">
          <label className="field-label">
            {t('oauth_authorization_url')}
            <OAuthRequiredMark />
          </label>
          <InputText
            value={authorizationUrl}
            onChange={(event) =>
              onFieldChange('authorizationUrl', event.target.value)
            }
            className={`w-full${!authorizationUrl.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_oauth_authorize_url')}
          />
        </div>
      )}

      <div className="form-field">
        <label className="field-label">
          {t('oauth_token_url')}
          <OAuthRequiredMark />
        </label>
        <InputText
          value={tokenUrl}
          onChange={(event) => onFieldChange('tokenUrl', event.target.value)}
          className={`w-full${!tokenUrl.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_oauth_token_url')}
        />
      </div>

      {isAuthorizationCode && (
        <div className="oauth-detail-form-row">
          <div className="form-field">
            <label className="field-label">
              {t('oauth_code_challenge_method')}
              <OAuthRequiredMark />
            </label>
            <Dropdown
              value={codeChallengeMethod || null}
              options={codeChallengeMethodOptions}
              onChange={(event) =>
                onFieldChange('codeChallengeMethod', event.value ?? '')
              }
              className={`w-full${!codeChallengeMethod ? ' p-invalid' : ''}`}
              placeholder={t('select_oauth_code_challenge_method')}
              appendTo="self"
            />
          </div>

          {isEditing && status ? (
            <div className="form-field">
              <label className="field-label">
                {t('oauth_connection_status')}
              </label>
              <InputText
                value={getOAuthStatusLabel(t, status)}
                className="w-full"
                disabled
              />
            </div>
          ) : (
            <div className="form-field" />
          )}
        </div>
      )}

      <div className="form-field">
        <label className="field-label">
          {t('oauth_client_secret')} ({t('optional')})
        </label>
        <McpAuthTokenSelect
          value={clientSecretTokenId}
          tokens={tokens}
          tokensLoading={tokensLoading}
          onChange={(tokenId) => onFieldChange('clientSecretTokenId', tokenId)}
        />
      </div>

      <div className="form-field oauth-detail-enabled-field">
        <div className="oauth-detail-enabled-switch">
          <InputSwitch
            inputId="oauth-enabled"
            checked={enabled}
            onChange={(event) => onFieldChange('enabled', event.value)}
          />
          <label className="field-label" htmlFor="oauth-enabled">
            {t('enabled')}
          </label>
        </div>
      </div>
    </>
  )
}
