import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpCardProps } from '../../types/Mcp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import BaseCard from '../shared/BaseCard'
import { getMcpTransportLabel } from '../../utils/mcpHelpers'

const McpCard: React.FC<McpCardProps> = ({
  mcpServer,
  onToggleActive,
  onConfigure,
  onRemove,
}) => {
  const { t } = useTranslation()

  const getDescription = () => {
    const parts: string[] = [`${t('url')}: ${mcpServer.config.url}`]
    if (mcpServer.config.authorizationHeaderName) {
      parts.push(
        `${t('authorization_header_name')}: ${mcpServer.config.authorizationHeaderName}`
      )
    }
    return parts.join('\n')
  }

  return (
    <BaseCard
      id={mcpServer.id}
      title={mcpServer.name}
      description={getDescription()}
      icon={<FontAwesomeIcon icon={faServer} />}
      badge={getMcpTransportLabel(t, mcpServer.transport)}
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
          label: t('remove'),
          onClick: () => onRemove(mcpServer.id),
          disabled: mcpServer.enabled,
          title: mcpServer.enabled
            ? t('cannot_delete_active_mcp')
            : t('remove_mcp'),
          className: 'remove-button',
        },
      ]}
      onClick={() => onConfigure(mcpServer)}
    />
  )
}

export default McpCard
