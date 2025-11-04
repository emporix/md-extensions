import React from 'react';
import { useTranslation } from 'react-i18next';
import { TokenCardProps } from '../../types/Token';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import BaseCard from '../shared/BaseCard';

const TokenCard: React.FC<TokenCardProps> = ({ token, onConfigure, onRemove }) => {
  const { t } = useTranslation();

  const getTokenTypeLabel = () => {
    if (token.id.includes('openai')) {
      return 'OpenAI';
    } else if (token.id.includes('anthropic')) {
      return 'Anthropic';
    } else if (token.id.includes('emporix')) {
      return 'Emporix';
    }
    return 'API Token';
  };

  return (
    <BaseCard
      id={token.id}
      title={token.name}
      description=""
      icon={<FontAwesomeIcon icon={faKey} />}
      badge={getTokenTypeLabel()}
      enabled={true}
      actions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(token),
          className: 'configure-button'
        },
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(token.id),
          className: 'remove-button'
        }
      ]}
      onClick={() => onConfigure(token)}
      switchDisabled={true}
    />
  );
};

export default TokenCard;
