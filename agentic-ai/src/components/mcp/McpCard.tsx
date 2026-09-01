import { useTranslation } from 'react-i18next'
import { McpCardProps } from '../../types/Mcp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import BaseCard from '../shared/BaseCard'
import {
  getDynamicMcpToolCounts,
  getMcpServerBadgeLabel,
  getMcpServerDescription,
  isDynamicMcpServer,
} from '../../utils/mcpHelpers'

const McpCard = ({
  mcpServer,
  onToggleActive,
  onConfigure,
  onRemove,
}: McpCardProps) => {
  const { t } = useTranslation()
  const { enabled: enabledToolCount } = getDynamicMcpToolCounts(mcpServer)
  const isMcpActive = mcpServer.enabled !== false
  const cannotEnable =
    isDynamicMcpServer(mcpServer) && !isMcpActive && enabledToolCount === 0

  return (
    <BaseCard
      id={mcpServer.id}
      title={mcpServer.name}
      description={getMcpServerDescription(t, mcpServer)}
      icon={<FontAwesomeIcon icon={faServer} />}
      badge={getMcpServerBadgeLabel(t, mcpServer)}
      enabled={mcpServer.enabled}
      onToggleActive={onToggleActive}
      switchDisabled={cannotEnable}
      switchDisabledTitle={
        cannotEnable ? t('mcp_validation_enabled_tool_required') : undefined
      }
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
