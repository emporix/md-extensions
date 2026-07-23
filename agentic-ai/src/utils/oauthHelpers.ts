import { TFunction } from 'i18next'
import { GrantType } from '../types/Agent'
import { OAuth } from '../types/OAuth'

export const createEmptyOAuth = (): OAuth => ({
  id: '',
  url: '',
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
  return grantType
}

export const resolveOAuthId = (
  oauth: { id: string } | string | undefined
): string => (typeof oauth === 'object' ? oauth?.id || '' : oauth || '')
