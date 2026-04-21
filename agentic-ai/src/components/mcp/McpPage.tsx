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
      showSuccess(t('mcp_server_updated_successfully'))
      await refreshMcpServers()
      setShowConfigPanel(false)
      setSelectedMcpServer(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_saving_mcp_server')
      showError(`${t('error_saving_mcp_server')}: ${errorMessage}`)
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
      title={t('mcp_servers')}
      addButtonLabel={t('add_new_mcp_server')}
      onAdd={handleAddNewMcpServer}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_mcp_server')}
      deleteConfirmMessage={t('delete_mcp_server_confirmation')}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="mcp"
    >
      {mcpServers.length === 0 ? (
        <div className="mcp-empty-state">
          <p>{t('no_mcp_servers')}</p>
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
        title={t('force_delete_mcp')}
        message={t('force_delete_mcp_message')}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete')}
        severity="warning"
      />

      <ConfirmDialog
        visible={forceToggleConfirmVisible}
        title={t('force_disable_mcp')}
        message={t('force_disable_mcp_message')}
        onConfirm={confirmForceToggle}
        onHide={hideForceToggleConfirm}
        confirmLabel={t('force_disable')}
        severity="warning"
      />
    </BasePage>
  )
}

export default McpPage
