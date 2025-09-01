import React from 'react';
import { Card } from 'primereact/card';
import { useTranslation } from 'react-i18next';
import { McpCardProps } from '../types/Mcp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@fortawesome/free-solid-svg-icons';

const McpCard: React.FC<McpCardProps> = ({ mcpServer, onConfigure, onRemove }) => {
  const { t } = useTranslation();

  const getTransportLabel = () => {
    switch (mcpServer.transport) {
      case 'sse':
        return 'Server-Sent Events';
      case 'stdio':
        return 'Standard I/O';
      case 'websocket':
        return 'WebSocket';
      default:
        return mcpServer.transport.toUpperCase();
    }
  };

  const cardHeader = (
    <div className="custom-agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="agent-icon">
        <FontAwesomeIcon icon={faServer} />
      </div>
      <div className="agent-tags">
        <span className="tool-type-badge">{getTransportLabel()}</span>
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
            onConfigure(mcpServer);
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
            onRemove(mcpServer.id);
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
      onClick={() => onConfigure(mcpServer)}
      style={{ cursor: 'pointer' }}
    >
      <div className="agent-content">
        <h3 className="agent-name">{mcpServer.name}</h3>
        <p className="agent-description">
          URL: {mcpServer.config.url}
          {mcpServer.config.authorizationHeaderName && (
            <>
              <br />
              Auth: {mcpServer.config.authorizationHeaderName}
            </>
          )}
        </p>
      </div>
    </Card>
  );
};

export default McpCard;
