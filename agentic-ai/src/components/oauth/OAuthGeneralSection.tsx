import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { GrantType } from '../../types/Agent'
import { Token } from '../../types/Token'
import type { OAuthConfigField } from '../../hooks/useOAuthConfig'
import { OAuthRequiredMark } from './OAuthRequiredMark'
import { McpAuthTokenSelect } from '../mcp/McpAuthTokenSelect'

interface OAuthGeneralSectionProps {
  oauthId: string
  url: string
  clientId: string
  grantType: GrantType | ''
  scope: string
  clientSecretTokenId: string
  enabled: boolean
  isEditing: boolean
  tokens: Token[]
  tokensLoading: boolean
  onFieldChange: (
    field: OAuthConfigField,
    value: string | boolean | GrantType
  ) => void
}

export const OAuthGeneralSection: React.FC<OAuthGeneralSectionProps> = ({
  oauthId,
  url,
  clientId,
  grantType,
  scope,
  clientSecretTokenId,
  enabled,
  isEditing,
  tokens,
  tokensLoading,
  onFieldChange,
}) => {
  const { t } = useTranslation()

  const grantTypeOptions = useMemo(
    () => [
      {
        label: t('grant_type_client_credentials'),
        value: GrantType.CLIENT_CREDENTIALS,
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

      <div className="form-field">
        <label className="field-label">
          {t('oauth_url')}
          <OAuthRequiredMark />
        </label>
        <InputText
          value={url}
          onChange={(event) => onFieldChange('url', event.target.value)}
          className={`w-full${!url.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_oauth_url')}
        />
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
