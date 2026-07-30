import { TFunction } from 'i18next'
import { GrantType } from '../types/Agent'
import {
  CodeChallengeMethod,
  OAuth,
  OAuthAuthorizationStatus,
} from '../types/OAuth'

export const createEmptyOAuth = (): OAuth => ({
  id: '',
  tokenUrl: '',
  clientId: '',
  grantType: GrantType.CLIENT_CREDENTIALS,
  scope: '',
  enabled: true,
})

export const getOAuthDisplayName = (oauth: OAuth): string => {
  if (oauth.clientId.trim()) {
    return oauth.clientId
  }
  return oauth.id
}

export const getOAuthGrantTypeLabel = (
  t: TFunction,
  grantType: GrantType | string
): string => {
  if (grantType === GrantType.CLIENT_CREDENTIALS) {
    return t('grant_type_client_credentials')
  }
  if (grantType === GrantType.AUTHORIZATION_CODE) {
    return t('grant_type_authorization_code')
  }
  return grantType
}

export const getOAuthStatusLabel = (
  t: TFunction,
  status?: OAuthAuthorizationStatus | string
): string => {
  switch (status) {
    case OAuthAuthorizationStatus.PENDING:
      return t('oauth_status_pending')
    case OAuthAuthorizationStatus.CONNECTED:
      return t('oauth_status_connected')
    case OAuthAuthorizationStatus.EXPIRED:
      return t('oauth_status_expired')
    case OAuthAuthorizationStatus.REVOKED:
      return t('oauth_status_revoked')
    default:
      return status || ''
  }
}

export const getCodeChallengeMethodLabel = (
  t: TFunction,
  method: CodeChallengeMethod | string
): string => {
  if (method === CodeChallengeMethod.S256) {
    return t('code_challenge_method_s256')
  }
  return method
}

export const resolveOAuthId = (
  oauth: { id: string } | string | undefined
): string => (typeof oauth === 'object' ? oauth?.id || '' : oauth || '')
