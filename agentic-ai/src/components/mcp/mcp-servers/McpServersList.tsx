import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServer } from '../../../types/Agent'
import { McpServer as ManagedMcpServer } from '../../../types/Mcp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer, faCog } from '@fortawesome/free-solid-svg-icons'
import { MCP_SERVERS, McpKey } from '../../../utils/constants'
import { McpServerForm } from './McpServerForm'

interface McpServersListProps {
  mcpServers: McpServer[]
  availableMcpServers: ManagedMcpServer[]
  onDelete: (index: number) => void
  onEdit: (index: number) => void
  onUpdate: (index: number, mcpServer: McpServer) => void
  onCancelEdit: () => void
  editingIndex?: number
  existingServerIds: string[]
  existingDomains: string[]
}

export const McpServersList: React.FC<McpServersListProps> = ({
  mcpServers,
  availableMcpServers,
  onDelete,
  onEdit,
  onUpdate,
  onCancelEdit,
  editingIndex,
  existingServerIds,
  existingDomains,
}) => {
  const { t } = useTranslation()

  if (mcpServers.length === 0) {
    return null
  }

  const getMcpServerDisplayInfo = (mcpServer: McpServer) => {
    if (mcpServer.type === 'predefined' && mcpServer.domain) {
      const predefinedServer = MCP_SERVERS[mcpServer.domain as McpKey]
      return {
        name: predefinedServer?.name ?? mcpServer.domain,
        icon: faServer,
        type: 'predefined' as const,
        details: t('mcp_tools_selected', {
          count: mcpServer.tools?.length ?? 0,
        }),
        enabled: true,
      }
    }

    const customServerId = mcpServer.mcpServer?.id
    if (mcpServer.type === 'custom' && customServerId) {
      const customServer = availableMcpServers.find(
        (server) => server.id === customServerId
      )
      return {
        name: customServer?.name ?? customServerId,
        icon: faServer,
        type: 'custom' as const,
        details: customServer?.config.url ?? t('custom_mcp_server'),
        enabled: customServer?.enabled !== false,
      }
    }

    return {
      name: t('unknown_mcp_server'),
      icon: faCog,
      type: 'unknown' as const,
      details: t('invalid_mcp_configuration'),
      enabled: false,
    }
  }

  return (
    <div className="mcp-servers-list">
      {mcpServers.map((mcpServer, idx) => {
        const serverInfo = getMcpServerDisplayInfo(mcpServer)
        const isDisabled = !serverInfo.enabled

        return (
          <div
            className={`mcp-server-row ${isDisabled ? 'mcp-server-disabled' : ''}`}
            key={idx}
            title={isDisabled ? t('mcp_server_disabled') : undefined}
          >
            {editingIndex === idx ? (
              <McpServerForm
                onAdd={(updatedServer) => onUpdate(idx, updatedServer)}
                onCancel={onCancelEdit}
                availableMcpServers={availableMcpServers}
                existingServerIds={existingServerIds}
                existingDomains={existingDomains}
                editingMcpServer={mcpServer}
              />
            ) : (
              <>
                <div className="mcp-server-row-top">
                  <div className="mcp-server-info">
                    <div className="mcp-server-agent">
                      <FontAwesomeIcon
                        icon={serverInfo.icon}
                        className="mcp-server-icon"
                      />
                      <span className="mcp-server-name">
                        {serverInfo.name}
                        {isDisabled && (
                          <span className="mcp-server-disabled-label">
                            ({t('disabled')})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mcp-server-actions">
                    <button
                      className="mcp-server-edit-btn"
                      type="button"
                      aria-label={t('edit')}
                      onClick={() => onEdit(idx)}
                    >
                      <i className="pi pi-pencil"></i>
                    </button>
                    <button
                      className="mcp-server-delete-btn"
                      type="button"
                      aria-label={t('delete')}
                      onClick={() => onDelete(idx)}
                    >
                      <i className="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="mcp-server-divider" />
                <div className="mcp-server-details">
                  <div className="mcp-server-config">
                    <span className="mcp-server-type-badge">
                      {serverInfo.type === 'predefined'
                        ? t('emporix')
                        : t('custom')}
                    </span>
                    <span className="mcp-server-details-text">
                      {serverInfo.details}
                    </span>
                  </div>
                  {mcpServer.type === 'predefined' && mcpServer.tools && (
                    <div className="mcp-server-tools">
                      {mcpServer.tools.map((tool: string) => (
                        <span className="mcp-server-tool-chip" key={tool}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
