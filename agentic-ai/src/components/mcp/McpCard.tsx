import React from 'react'
import { useTranslation } from 'react-i18next'
import { CustomMcpServerTransportType, McpCardProps } from '../../types/Mcp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import BaseCard from '../shared/BaseCard'

const McpCard: React.FC<McpCardProps> = ({
  mcpServer,
  onToggleActive,
  onConfigure,
  onRemove,
}) => {
  const { t } = useTranslation()

  const getTransportLabel = () => {
    switch (mcpServer.transport) {
      case CustomMcpServerTransportType.SSE:
        return 'Server-Sent Events'
      case CustomMcpServerTransportType.STREAMABLE_HTTP:
        return 'Streamable HTTP'
      default:
        return String(mcpServer.transport).toUpperCase()
    }
  }

  const getDescription = () => {
    const parts: string[] = [`URL: ${mcpServer.config.url}`]
    if (mcpServer.config.authorizationHeaderName) {
      parts.push(`Auth: ${mcpServer.config.authorizationHeaderName}`)
    }
    return parts.join('\n')
  }

  return (
    <BaseCard
      id={mcpServer.id}
      title={mcpServer.name}
      description={getDescription()}
      icon={<FontAwesomeIcon icon={faServer} />}
      badge={getTransportLabel()}
      enabled={mcpServer.enabled}
      onToggleActive={onToggleActive}
      actions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(mcpServer),
          className: 'configure-button',
        },
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(mcpServer.id),
          disabled: mcpServer.enabled,
          title: mcpServer.enabled
            ? t('cannot_delete_active_mcp', 'Cannot delete active MCP server')
            : t('remove_mcp', 'Remove MCP server'),
          className: 'remove-button',
        },
      ]}
      onClick={() => onConfigure(mcpServer)}
    />
  )
}

export default McpCard
