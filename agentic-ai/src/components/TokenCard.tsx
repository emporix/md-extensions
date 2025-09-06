import React from 'react';
import { useTranslation } from 'react-i18next';
import { TokenCardProps } from '../types/Token';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import BaseCard from './common/BaseCard';

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
      icon={<FontAwesomeIcon icon={faKey} />}
      badge={getTokenTypeLabel()}
      title={token.name}
      description={token.value ? `Value: ${'•'.repeat(12)}` : 'No value configured'}
      primaryActions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(token)
        }
      ]}
      secondaryActions={[
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(token.id)
        }
      ]}
      onClick={() => onConfigure(token)}
    />
  );
};

export default TokenCard;
