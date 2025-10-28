import React from 'react';
import { useTranslation } from 'react-i18next';
import { McpCardProps } from '../../types/Mcp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import BaseCard from '../shared/BaseCard';

const McpCard: React.FC<McpCardProps> = ({ mcpServer, onToggleActive, onConfigure, onRemove }) => {
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
      id={mcpServer.id}
      icon={<FontAwesomeIcon icon={faServer} />}
      badge={getTransportLabel()}
      title={mcpServer.name}
      description={getDescription()}
      enabled={mcpServer.enabled}
      onToggleActive={onToggleActive}
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
          onClick: () => onRemove(mcpServer.id),
          disabled: mcpServer.enabled,
          title: mcpServer.enabled ? t('cannot_delete_active_mcp', 'Cannot delete active MCP server') : undefined
        }
      ]}
      onClick={() => onConfigure(mcpServer)}
    />
  );
};

export default McpCard;
