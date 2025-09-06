import React from 'react';
import { useTranslation } from 'react-i18next';
import { McpCardProps } from '../../types/Mcp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import BaseCard from '../shared/BaseCard';

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

  const getDescription = () => (
    <>
      URL: {mcpServer.config.url}
      {mcpServer.config.authorizationHeaderName && (
        <>
          <br />
          Auth: {mcpServer.config.authorizationHeaderName}
        </>
      )}
    </>
  );

  return (
    <BaseCard
      icon={<FontAwesomeIcon icon={faServer} />}
      badge={getTransportLabel()}
      title={mcpServer.name}
      description={getDescription()}
      primaryActions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(mcpServer)
        }
      ]}
      secondaryActions={[
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(mcpServer.id)
        }
      ]}
      onClick={() => onConfigure(mcpServer)}
    />
  );
};

export default McpCard;
