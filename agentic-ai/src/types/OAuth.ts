import { GrantType } from './Agent'

export interface OAuthClientSecretTokenRef {
  id: string
}

export interface OAuth {
  id: string
  url: string
  clientId: string
  grantType: GrantType
  scope?: string
  enabled?: boolean
  clientSecretToken?: OAuthClientSecretTokenRef
}

export interface OAuthCardProps {
  oauth: OAuth
  onToggleActive: (oauthId: string, enabled: boolean) => void
  onConfigure: (oauth: OAuth) => void
  onRemove: (oauthId: string) => void
}
