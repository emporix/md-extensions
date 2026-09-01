import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { ProgressBar } from 'primereact/progressbar'
import { Badge } from 'primereact/badge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { importAgents } from '../../services/agentService'
import { ImportedItem, ImportAgentsResult } from '../../types/Job'
import { ImportEntityDetails } from '../shared/ImportEntityDetails'
import {
  getImportStateLabel,
  getImportStateSeverity,
  hasImportFailures,
  shouldShowLegacyTokenNote,
} from '../../utils/importDetails'
import { useAppState } from '../../contexts/AppStateContext'
import { useToast } from '../../contexts/ToastContext'

interface ImportAgentDialogProps {
  visible: boolean
  onHide: () => void
  onImport: () => void
}

const ImportAgentDialog = ({
  visible,
  onHide,
  onImport,
}: ImportAgentDialogProps) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportAgentsResult | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return

      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showError(t('invalid_file_type'))
        return
      }

      setIsImporting(true)

      try {
        const fileContent = await file.text()
        const parsedJson = JSON.parse(fileContent)
        const result = await importAgents(appState, parsedJson)

        setImportResult(result)
        showSuccess(result.message || t('agent_imported_successfully'))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t('import_generic_error')
        showError(`${t('error_importing_agent')}: ${errorMessage}`)
      } finally {
        setIsImporting(false)
      }
    },
    [appState, showSuccess, showError, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleHide = useCallback(() => {
    setIsDragOver(false)
    setImportResult(null)
    setIsImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onHide()
  }, [onHide])

  const handleSummaryOk = useCallback(() => {
    onImport()
    handleHide()
  }, [onImport, handleHide])

  const renderSummaryItems = (items: ImportedItem[]) =>
    items.map((item, idx) => (
      <div key={item.id || idx} className="import-summary-item">
        <div className="import-summary-item-header">
          <span className="import-item-name">{item.name}</span>
          <Badge
            value={getImportStateLabel(t, item.state)}
            severity={getImportStateSeverity(item.state)}
          />
        </div>
        <ImportEntityDetails details={item.details} />
      </div>
    ))

  const allImportedItems = importResult
    ? [
        ...importResult.summary.agents,
        ...importResult.summary.tools,
        ...importResult.summary.mcpServers,
      ]
    : []
  const hasFailures = hasImportFailures(allImportedItems)

  const footer = isImporting ? (
    <div className="dialog-actions">
      <Button
        type="button"
        label={t('cancel')}
        onClick={handleHide}
        className="p-button-secondary"
      />
    </div>
  ) : importResult ? (
    <div className="dialog-actions">
      <Button type="button" label={t('ok')} onClick={handleSummaryOk} />
    </div>
  ) : (
    <div className="dialog-actions">
      <Button
        type="button"
        label={t('cancel')}
        onClick={handleHide}
        className="p-button-secondary"
      />
      <Button
        label={t('browse_files')}
        icon="pi pi-folder-open"
        onClick={handleBrowseClick}
        className="p-button-primary"
      />
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={t('import_agent')}
      footer={footer}
      className="import-agent-dialog"
      modal
      closeOnEscape={!isImporting && !importResult}
      closable={!isImporting && !importResult}
      style={{ width: '80vw', maxWidth: '900px' }}
    >
      <div className="import-agent-content">
        {isImporting ? (
          <div className="add-agent-loading-state">
            <div className="agent-icon loading-icon">📥</div>
            <h2 className="dialog-title loading-title">{t('importing')}</h2>
            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
            <p className="loading-text">{t('please_wait_import')}</p>
          </div>
        ) : importResult ? (
          <div className="import-summary">
            <div className="import-summary-header">
              <div
                className={`import-summary-icon${hasFailures ? ' import-summary-icon--warning' : ''}`}
              >
                <FontAwesomeIcon
                  icon={hasFailures ? faTriangleExclamation : faCheck}
                />
              </div>
              <h2 className="dialog-title">{t('import_completed')}</h2>
              <p className="import-summary-message">{importResult.message}</p>
            </div>

            <div className="import-summary-sections">
              {importResult.summary.agents.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">{t('agents')}</h3>
                  <div className="import-summary-items">
                    {renderSummaryItems(importResult.summary.agents)}
                  </div>
                </div>
              )}

              {importResult.summary.tools.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">
                    {t('tools')}
                    {importResult.summary.tools.some(
                      (tool) => tool.state === 'TO_CREATE'
                    ) && (
                      <i
                        className="pi pi-info-circle import-info-icon"
                        title={t('TO_CREATE_note')}
                      />
                    )}
                  </h3>
                  <div className="import-summary-items">
                    {renderSummaryItems(importResult.summary.tools)}
                  </div>
                </div>
              )}

              {importResult.summary.mcpServers.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">{t('mcp_servers')}</h3>
                  <div className="import-summary-items">
                    {renderSummaryItems(importResult.summary.mcpServers)}
                  </div>
                </div>
              )}
            </div>

            {shouldShowLegacyTokenNote(allImportedItems) && (
              <div className="import-summary-note">
                <p>{t('token_required_note')}</p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowseClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <div className="drop-zone-content">
              <i className="pi pi-download drop-zone-icon"></i>
              <p className="drop-zone-title">{t('drag_drop_file')}</p>
              <p className="drop-zone-subtitle">{t('or_click_to_browse')}</p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default ImportAgentDialog
