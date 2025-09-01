import React from 'react';
import { Card } from 'primereact/card';
import { useTranslation } from 'react-i18next';
import { TokenCardProps } from '../types/Token';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';

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

  const cardHeader = (
    <div className="custom-agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="agent-icon">
        <FontAwesomeIcon icon={faKey} />
      </div>
      <div className="agent-tags">
        <span className="tool-type-badge">{getTokenTypeLabel()}</span>
      </div>
    </div>
  );

  const cardFooter = (
    <div className="custom-agent-card-footer">
      <div className="top-row">
        <button 
          className="text-button configure-button" 
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(token);
          }}
        >
          <i className="pi pi-cog"></i>
          {t('configure')}
        </button>
      </div>
      
      <div className="bottom-row">
        <div style={{ flex: 1 }}></div>
        <button 
          className="text-button remove-button" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(token.id);
          }}
        >
          <i className="pi pi-trash"></i>
          {t('remove', 'Remove')}
        </button>
      </div>
    </div>
  );

  return (
    <Card 
      className="custom-agent-card" 
      header={cardHeader} 
      footer={cardFooter}
      onClick={() => onConfigure(token)}
      style={{ cursor: 'pointer' }}
    >
      <div className="agent-content">
        <h3 className="agent-name">{token.name}</h3>
        <p className="agent-description">
          {token.value ? `Value: ${'•'.repeat(12)}` : 'No value configured'}
        </p>
      </div>
    </Card>
  );
};

export default TokenCard;
