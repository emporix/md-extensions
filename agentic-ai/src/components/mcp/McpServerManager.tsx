import React, { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerList } from './mcp-server/McpServerList'
import { McpServerForm } from './mcp-server/McpServerForm'
import { McpKey } from '../../utils/constants'

interface McpServer {
  type: 'predefined' | 'custom'
  name?: McpKey | string
  tools?: string[]
  url?: string
  transport?: string
  config?: {
    headers?: Record<string, string>
  }
}

interface McpServerManagerProps {
  mcpServers: McpServer[]
  onMcpServersChange: (servers: McpServer[]) => void
}

export const McpServerManager: React.FC<McpServerManagerProps> = memo(
  ({ mcpServers, onMcpServersChange }) => {
    const { t } = useTranslation()
    const [showAddMcp, setShowAddMcp] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | undefined>()

    const handleAddMcp = useCallback(
      (server: McpServer) => {
        onMcpServersChange([...mcpServers, server])
        setShowAddMcp(false)
      },
      [mcpServers, onMcpServersChange]
    )

    const handleUpdateMcp = useCallback(
      (index: number, server: McpServer) => {
        const updatedServers = [...mcpServers]
        updatedServers[index] = server
        onMcpServersChange(updatedServers)
        setEditingIndex(undefined)
      },
      [mcpServers, onMcpServersChange]
    )

    const handleDeleteMcp = useCallback(
      (index: number) => {
        onMcpServersChange(mcpServers.filter((_, i) => i !== index))
      },
      [mcpServers, onMcpServersChange]
    )

    const handleCancelAdd = useCallback(() => {
      setShowAddMcp(false)
    }, [])

    const handleCancelEdit = useCallback(() => {
      setEditingIndex(undefined)
    }, [])

    const handleEditMcp = useCallback((index: number) => {
      setEditingIndex(index)
    }, [])

    return (
      <div className="mcp-servers-section">
        <div className="mcp-servers-header">
          <span className="mcp-servers-title">
            {t('mcp_servers', 'MCP Servers')}
          </span>
          <button
            className="mcp-servers-add-btn"
            type="button"
            aria-label={t('add', 'Add')}
            onClick={() => setShowAddMcp(true)}
          >
            <i className="pi pi-plus"></i>
          </button>
        </div>

        <McpServerList
          mcpServers={mcpServers}
          onDelete={handleDeleteMcp}
          onEdit={handleEditMcp}
          onUpdate={handleUpdateMcp}
          onCancelEdit={handleCancelEdit}
          editingIndex={editingIndex}
        />

        {showAddMcp && (
          <McpServerForm onAdd={handleAddMcp} onCancel={handleCancelAdd} />
        )}
      </div>
    )
  }
)
