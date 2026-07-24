import { GrantType } from './Agent'

export enum CodeChallengeMethod {
  S256 = 'S256',
}

export enum OAuthAuthorizationStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface OAuthClientSecretTokenRef {
  id: string
}

export interface OAuth {
  id: string
  clientId: string
  grantType: GrantType
  tokenUrl: string
  authorizationUrl?: string
  scope?: string
  enabled?: boolean
  clientSecretToken?: OAuthClientSecretTokenRef
  codeChallengeMethod?: CodeChallengeMethod
  status?: OAuthAuthorizationStatus
}

export interface OAuthConnectResponse {
  id: string
  status: OAuthAuthorizationStatus
  authorizationUrl: string
}

export interface OAuthCardProps {
  oauth: OAuth
  onToggleActive: (oauthId: string, enabled: boolean) => void
  onConfigure: (oauth: OAuth) => void
  onRemove: (oauthId: string) => void
}
