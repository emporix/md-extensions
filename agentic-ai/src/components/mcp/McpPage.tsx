import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import McpCard from './McpCard'
import McpConfigPanel from './McpConfigPanel'
import { BasePage } from '../shared/BasePage'
import { McpServer } from '../../types/Mcp'
import { useMcp } from '../../hooks/useMcp'
import { AppState } from '../../types/common'
import { createEmptyMcpServer } from '../../utils/mcpHelpers'
import { useToast } from '../../contexts/ToastContext'
import { ConfirmDialog } from '../shared/ConfirmDialog'

interface McpPageProps {
  appState?: AppState
}

const McpPage: React.FC<McpPageProps> = ({
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
    contentLanguage: 'en',
  },
}) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const {
    mcpServers,
    loading,
    error,
    upsertMcpServer,
    refreshMcpServers,
    removeMcpServer,
    toggleMcpServerActive,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  } = useMcp(appState)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [selectedMcpServer, setSelectedMcpServer] = useState<McpServer | null>(
    null
  )

  const handleConfigure = (mcpServer: McpServer) => {
    setSelectedMcpServer(mcpServer)
    setShowConfigPanel(true)
  }

  const handleAddNewMcpServer = useCallback(() => {
    setSelectedMcpServer(createEmptyMcpServer())
    setShowConfigPanel(true)
  }, [])

  const handleConfigSave = async (updatedMcpServer: McpServer) => {
    try {
      await upsertMcpServer(updatedMcpServer)
      showSuccess(
        t('mcp_server_updated_successfully', 'MCP Server updated successfully!')
      )
      await refreshMcpServers()
      setShowConfigPanel(false)
      setSelectedMcpServer(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save MCP server'
      showError(
        `${t('error_saving_mcp_server', 'Error saving MCP server')}: ${errorMessage}`
      )
      // Don't close the panel on error - let user fix the issue
    }
  }

  const handleConfigClose = () => {
    setShowConfigPanel(false)
    setSelectedMcpServer(null)
  }

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('mcp_servers', 'MCP Servers')}
      addButtonLabel={t('add_new_mcp_server', 'ADD NEW MCP SERVER')}
      onAdd={handleAddNewMcpServer}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_mcp_server', 'Delete MCP Server')}
      deleteConfirmMessage={t(
        'delete_mcp_server_confirmation',
        'Are you sure you want to delete this MCP server? This action cannot be undone.'
      )}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="mcp"
    >
      {mcpServers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>{t('no_mcp_servers', 'No MCP servers available')}</p>
        </div>
      ) : (
        <div className="agents-grid">
          {mcpServers.map((mcpServer) => (
            <McpCard
              key={mcpServer.id}
              mcpServer={mcpServer}
              onToggleActive={toggleMcpServerActive}
              onConfigure={handleConfigure}
              onRemove={removeMcpServer}
            />
          ))}
        </div>
      )}

      <McpConfigPanel
        visible={showConfigPanel}
        mcpServer={selectedMcpServer}
        onHide={handleConfigClose}
        onSave={handleConfigSave}
        appState={appState}
      />

      <ConfirmDialog
        visible={forceDeleteConfirmVisible}
        title={t('force_delete_mcp', 'Force Delete MCP Server')}
        message={t(
          'force_delete_mcp_message',
          'MCP server is used by agents.\nBy deleting it, the MCP server will be removed from the agents and agents will be disabled.'
        )}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete', 'Force Delete')}
        severity="warning"
      />

      <ConfirmDialog
        visible={forceToggleConfirmVisible}
        title={t('force_disable_mcp', 'Force Disable MCP Server')}
        message={t(
          'force_disable_mcp_message',
          'MCP server is used by agents. By disabling it, the agents will be disabled as well.'
        )}
        onConfirm={confirmForceToggle}
        onHide={hideForceToggleConfirm}
        confirmLabel={t('force_disable', 'Force Disable')}
        severity="warning"
      />
    </BasePage>
  )
}

export default McpPage
