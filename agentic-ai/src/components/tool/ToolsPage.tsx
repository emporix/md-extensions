import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ToolCard from './ToolCard'
import ToolConfigPanel from './ToolConfigPanel'
import { BasePage } from '../shared/BasePage'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Tool } from '../../types/Tool'
import { useTools } from '../../hooks/useTools'
import { AppState } from '../../types/common'
import { createEmptyTool } from '../../utils/toolHelpers'
import { useToast } from '../../contexts/ToastContext'
import { reindex } from '../../services/aiRagIndexerService'

interface ToolsPageProps {
  appState?: AppState
}

const ToolsPage: React.FC<ToolsPageProps> = ({
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
  const [reindexConfirmVisible, setReindexConfirmVisible] = useState(false)
  const [toolToReindex, setToolToReindex] = useState<Tool | null>(null)

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
      showSuccess(t('tool_updated_successfully'))
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

  const handleReindex = (tool: Tool) => {
    setToolToReindex(tool)
    setReindexConfirmVisible(true)
  }

  const hideReindexConfirm = () => {
    setReindexConfirmVisible(false)
    setToolToReindex(null)
  }

  const confirmReindex = async () => {
    if (!toolToReindex) return

    if (!toolToReindex.config.entityType) {
      showError(
        t('entity_type_missing')
      )
      hideReindexConfirm()
      return
    }

    hideReindexConfirm()

    try {
      await reindex(appState, toolToReindex.config.entityType)
      showSuccess(
        t('reindex_triggered_successfully')
      )
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('failed_to_trigger_reindex')
      showError(
        `${t('error_triggering_reindex')}: ${errorMessage}`
      )
    }
  }

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('tools')}
      addButtonLabel={t('add_new_tool')}
      onAdd={handleAddNewTool}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_tool')}
      deleteConfirmMessage={t(
        'delete_tool_confirmation',
      )}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="tools"
    >
      {tools.length === 0 ? (
        <div className="state-empty">
          <p>{t('no_tools')}</p>
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
              onReindex={handleReindex}
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
        visible={reindexConfirmVisible}
        onHide={hideReindexConfirm}
        onConfirm={confirmReindex}
        title={t('reindex_tool')}
        message={t(
          'reindex_confirmation',
        )}
        confirmLabel={t('reindex')}
        severity="primary"
      />

      <ConfirmDialog
        visible={forceDeleteConfirmVisible}
        title={t('force_delete_tool')}
        message={t(
          'force_delete_tool_message',
        )}
        onConfirm={confirmForceDelete}
        onHide={hideForceDeleteConfirm}
        confirmLabel={t('force_delete')}
        severity="warning"
      />

      <ConfirmDialog
        visible={forceToggleConfirmVisible}
        title={t('force_disable_tool')}
        message={t(
          'force_disable_tool_message',
        )}
        onConfirm={confirmForceToggle}
        onHide={hideForceToggleConfirm}
        confirmLabel={t('force_disable')}
        severity="warning"
      />
    </BasePage>
  )
}

export default ToolsPage
