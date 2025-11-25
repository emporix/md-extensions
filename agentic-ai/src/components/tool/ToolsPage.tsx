import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ToolCard from './ToolCard'
import ToolConfigPanel from './ToolConfigPanel'
import { BasePage } from '../shared/BasePage'
import { Tool } from '../../types/Tool'
import { useTools } from '../../hooks/useTools'
import { AppState } from '../../types/common'
import { createEmptyTool } from '../../utils/toolHelpers'
import { useToast } from '../../contexts/ToastContext'
import { ConfirmDialog } from '../shared/ConfirmDialog'

interface ToolsPageProps {
  appState?: AppState
}

const ToolsPage: React.FC<ToolsPageProps> = ({
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
  },
}) => {
  const { t } = useTranslation()
  const { showSuccess } = useToast()
  const {
    tools,
    loading,
    error,
    updateTool,
    refreshTools,
    removeTool,
    toggleToolActive,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  } = useTools(appState)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)

  const handleConfigure = (tool: Tool) => {
    setSelectedTool(tool)
    setShowConfigPanel(true)
  }

  const handleAddNewTool = useCallback(() => {
    setSelectedTool(createEmptyTool())
    setShowConfigPanel(true)
  }, [])

  const handleConfigSave = async (updatedTool: Tool) => {
    try {
      await updateTool(updatedTool)
      await refreshTools()
      showSuccess(t('tool_updated_successfully', 'Tool updated successfully!'))
      setShowConfigPanel(false)
      setSelectedTool(null)
    } catch (error) {
      console.error(error)
      setShowConfigPanel(false)
      setSelectedTool(null)
    }
  }

  const handleConfigClose = () => {
    setShowConfigPanel(false)
    setSelectedTool(null)
  }

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('tools', 'Tools')}
      addButtonLabel={t('add_new_tool', 'ADD NEW TOOL')}
      onAdd={handleAddNewTool}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_tool', 'Delete Tool')}
      deleteConfirmMessage={t(
        'delete_tool_confirmation',
        'Are you sure you want to delete this tool? This action cannot be undone.'
      )}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="tools"
    >
      {tools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>{t('no_tools', 'No tools available')}</p>
        </div>
      ) : (
        <div className="agents-grid">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggleActive={toggleToolActive}
              onConfigure={handleConfigure}
              onRemove={removeTool}
            />
          ))}
        </div>
      )}

      <ToolConfigPanel
        visible={showConfigPanel}
        tool={selectedTool}
        onHide={handleConfigClose}
        onSave={handleConfigSave}
        appState={appState}
      />

      <ConfirmDialog
        visible={forceDeleteConfirmVisible}
        title={t('force_delete_tool', 'Force Delete Tool')}
        message={t(
          'force_delete_tool_message',
          'Tool is used by agents.\nBy deleting it, the tool will be removed from the agents and agents will be disabled.'
        )}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete', 'Force Delete')}
        severity="warning"
      />

      <ConfirmDialog
        visible={forceToggleConfirmVisible}
        title={t('force_disable_tool', 'Force Disable Tool')}
        message={t(
          'force_disable_tool_message',
          'Tool is used by agents. By disabling it, the agents will be disabled as well.'
        )}
        onConfirm={confirmForceToggle}
        onHide={hideForceToggleConfirm}
        confirmLabel={t('force_disable', 'Force Disable')}
        severity="warning"
      />
    </BasePage>
  )
}

export default ToolsPage
