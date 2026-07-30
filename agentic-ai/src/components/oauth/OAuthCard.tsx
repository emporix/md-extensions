import React from 'react'
import { useTranslation } from 'react-i18next'
import { OAuthCardProps } from '../../types/OAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import BaseCard from '../shared/BaseCard'
import {
  getOAuthDisplayName,
  getOAuthGrantTypeLabel,
} from '../../utils/oauthHelpers'

const OAuthCard: React.FC<OAuthCardProps> = ({
  oauth,
  onToggleActive,
  onConfigure,
  onRemove,
}) => {
  const { t } = useTranslation()
  const enabled = oauth.enabled !== false

  return (
    <BaseCard
      id={oauth.id}
      title={getOAuthDisplayName(oauth)}
      description={`${t('oauth_token_url')}: ${oauth.tokenUrl}`}
      icon={<FontAwesomeIcon icon={faLock} />}
      badge={getOAuthGrantTypeLabel(t, oauth.grantType)}
      enabled={enabled}
      onToggleActive={onToggleActive}
      actions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(oauth),
          className: 'configure-button',
        },
        {
          icon: 'pi pi-trash',
          label: t('remove'),
          onClick: () => onRemove(oauth.id),
          disabled: enabled,
          title: enabled ? t('cannot_delete_active_oauth') : t('remove_oauth'),
          className: 'remove-button',
        },
      ]}
      onClick={() => onConfigure(oauth)}
    />
  )
}

export default OAuthCard
