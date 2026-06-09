import React from 'react'
import { useTranslation } from 'react-i18next'
import { TokenCardProps } from '../../types/Token'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import BaseCard from '../shared/BaseCard'
import { getTokenTypeLabel } from '../../utils/tokenHelpers'

const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onConfigure,
  onRemove,
}) => {
  const { t } = useTranslation()

  return (
    <BaseCard
      id={token.id}
      title={token.name}
      description=""
      icon={<FontAwesomeIcon icon={faKey} />}
      badge={getTokenTypeLabel(t, token.id)}
      enabled={true}
      actions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(token),
          className: 'configure-button',
        },
        {
          icon: 'pi pi-trash',
          label: t('remove'),
          onClick: () => onRemove(token.id),
          title: t('remove_token'),
          className: 'remove-button',
        },
      ]}
      onClick={() => onConfigure(token)}
      switchDisabled={true}
    />
  )
}

export default TokenCard
