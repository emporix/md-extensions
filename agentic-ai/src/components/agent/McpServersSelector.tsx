import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { McpServer } from '../../types/Agent'
import { McpServer as ManagedMcpServer } from '../../types/Mcp'
import { getMcpServers } from '../../services/mcpService'
import { AppState } from '../../types/common'
import { McpServersList } from '../mcp/mcp-servers/McpServersList'
import { McpServerForm } from '../mcp/mcp-servers/McpServerForm'

interface McpServersSelectorProps {
  mcpServers: McpServer[]
  onChange: (mcpServers: McpServer[]) => void
  appState: AppState
}

export const McpServersSelector: React.FC<McpServersSelectorProps> = ({
  mcpServers,
  onChange,
  appState,
}) => {
  const { t } = useTranslation()
  const [availableMcpServers, setAvailableMcpServers] = useState<
    ManagedMcpServer[]
  >([])
  const [mcpServersLoading, setMcpServersLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | undefined>(
    undefined
  )

  useEffect(() => {
    const loadMcpServers = async () => {
      setMcpServersLoading(true)
      try {
        const fetchedServers = await getMcpServers(appState)
        setAvailableMcpServers(fetchedServers)
      } catch (error) {
        console.error(error)
        setAvailableMcpServers([])
      } finally {
        setMcpServersLoading(false)
      }
    }

    loadMcpServers()
  }, [appState])

  const handleAddMcpServer = useCallback(
    (mcpServer: McpServer) => {
      onChange([...mcpServers, mcpServer])
      setShowAddForm(false)
    },
    [mcpServers, onChange]
  )

  const handleDeleteMcpServer = useCallback(
    (index: number) => {
      const newMcpServers = mcpServers.filter((_, idx) => idx !== index)
      onChange(newMcpServers)
    },
    [mcpServers, onChange]
  )

  const handleEditMcpServer = useCallback((index: number) => {
    setEditingIndex(index)
    setShowAddForm(false)
  }, [])

  const handleUpdateMcpServer = useCallback(
    (index: number, mcpServer: McpServer) => {
      const newMcpServers = [...mcpServers]
      newMcpServers[index] = mcpServer
      onChange(newMcpServers)
      setEditingIndex(undefined)
    },
    [mcpServers, onChange]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(undefined)
  }, [])

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false)
  }, [])

  // Compute taken IDs/domains excluding the item currently being edited
  const existingCustomServerIds = mcpServers
    .filter(
      (server, idx) =>
        idx !== editingIndex &&
        server.type === 'custom' &&
        server.mcpServer?.id
    )
    .map((server) => server.mcpServer!.id)

  const existingDomains = mcpServers
    .filter(
      (server, idx) =>
        idx !== editingIndex && server.type === 'predefined' && server.domain
    )
    .map((server) => server.domain!)

  return (
    <div className="mcp-servers-section">
      <div className="mcp-servers-header">
        <h3 className="mcp-servers-title">{t('mcp_servers', 'MCP Servers')}</h3>
        <button
          className="mcp-servers-add-btn"
          onClick={() => setShowAddForm(true)}
          type="button"
          aria-label={t('add_mcp_server', 'Add MCP Server')}
          disabled={mcpServersLoading}
        >
          <i className="pi pi-plus"></i>
        </button>
      </div>

      <McpServersList
        mcpServers={mcpServers}
        availableMcpServers={availableMcpServers}
        onDelete={handleDeleteMcpServer}
        onEdit={handleEditMcpServer}
        onUpdate={handleUpdateMcpServer}
        onCancelEdit={handleCancelEdit}
        editingIndex={editingIndex}
        existingServerIds={existingCustomServerIds}
        existingDomains={existingDomains}
      />

      {showAddForm && (
        <McpServerForm
          onAdd={handleAddMcpServer}
          onCancel={handleCancelAdd}
          availableMcpServers={availableMcpServers}
          existingServerIds={existingCustomServerIds}
          existingDomains={existingDomains}
        />
      )}
    </div>
  )
}
