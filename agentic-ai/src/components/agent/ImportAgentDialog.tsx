import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { AgentService } from '../../services/agentService';
import { AppState, ImportSummaryState } from '../../types/common';
import { useToast } from '../../contexts/ToastContext';

interface ImportAgentDialogProps {
  visible: boolean;
  onHide: () => void;
  onImport: () => void;
  appState: AppState;
}

const ImportAgentDialog: React.FC<ImportAgentDialogProps> = ({
  visible,
  onHide,
  onImport,
  appState
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedAt: string;
    summary: {
      agents: Array<{ id: string; name: string; state: ImportSummaryState }>;
      tools: Array<{ id: string; name: string; state: ImportSummaryState }>;
      mcpServers: Array<{ id: string; name: string; state: ImportSummaryState }>;
    };
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showError(t('invalid_file_type', 'Please select a valid JSON file'));
      return;
    }

    setIsImporting(true);

    try {
      const fileContent = await file.text();
      
      const parsedJson = JSON.parse(fileContent);
      
      const agentService = new AgentService(appState);
      const result = await agentService.importAgents(parsedJson);

      setImportResult(result);
      showSuccess(result.message || t('agent_imported_successfully', 'Agent imported successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import agent';
      showError(`${t('error_importing_agent', 'Error importing agent')}: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  }, [appState, showSuccess, showError, t]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleHide = useCallback(() => {
    setIsDragOver(false);
    setImportResult(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  }, [onHide]);

  const handleSummaryOk = useCallback(() => {
    onImport();
    handleHide();
  }, [onImport, handleHide]);

  const getStateLabel = (state: ImportSummaryState) => {
    switch (state) {
      case 'ENABLED':
        return t('enabled', 'Enabled');
      case 'DISABLED':
        return t('disabled', 'Disabled');
      case 'TO_CREATE':
        return t('TO_CREATE', 'To Import');
      case 'EXISTS':
        return t('exists', 'Exists');
      default:
        return state;
    }
  };

  const getStateSeverity = (state: ImportSummaryState) => {
    switch (state) {
      case 'ENABLED':
        return 'success';
      case 'DISABLED':
        return 'warning';
      case 'TO_CREATE':
        return 'info';
      case 'EXISTS':
        return 'success';
      default:
        return undefined;
    }
  };

  const footer = isImporting ? (
    <div className="dialog-actions">
      <Button
        label={t('cancel', 'Cancel')}
        onClick={handleHide}
        className="discard-button"
      />
    </div>
  ) : importResult ? (
    <div className="dialog-actions">
      <Button
        label={t('ok', 'OK')}
        onClick={handleSummaryOk}
        className="p-button-primary"
      />
    </div>
  ) : (
    <div className="dialog-actions">
      <Button
        label={t('cancel', 'Cancel')}
        onClick={handleHide}
        className="discard-button"
      />
      <Button
        label={t('browse_files', 'Browse Files')}
        icon="pi pi-folder-open"
        onClick={handleBrowseClick}
        className="p-button-primary"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={t('import_agent', 'Import Agent')}
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
            <h2 className="dialog-title loading-title">
              {t('importing', 'Importing...')}
            </h2>
            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
            <p className="loading-text">
              {t('please_wait_import', 'Please wait while we import the agent...')}
            </p>
          </div>
        ) : importResult ? (
          <div className="import-summary">
            <div className="import-summary-header">
              <div className="success-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <h2 className="dialog-title">
                {t('import_completed', 'Import Completed')}
              </h2>
              <p className="import-summary-message">
                {importResult.message}
              </p>
            </div>

            <div className="import-summary-sections">
              {importResult.summary.agents.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">
                    {t('agents', 'Agents')}
                  </h3>
                  <div className="import-summary-items">
                    {importResult.summary.agents.map((agent, idx) => (
                      <div key={idx} className="import-summary-item">
                        <span className="import-item-name">{agent.name}</span>
                        <Badge 
                          value={getStateLabel(agent.state)} 
                          severity={getStateSeverity(agent.state) as any}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.summary.tools.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">
                    {t('tools', 'Tools')}
                    {importResult.summary.tools.some(t => t.state === 'TO_CREATE') && (
                      <i 
                        className="pi pi-info-circle import-info-icon" 
                        title={t('TO_CREATE_note', 'Items marked as "To Import" need to be added manually.')}
                      />
                    )}
                  </h3>
                  <div className="import-summary-items">
                    {importResult.summary.tools.map((tool, idx) => (
                      <div key={idx} className="import-summary-item">
                        <span className="import-item-name">{tool.name}</span>
                        <Badge 
                          value={getStateLabel(tool.state)} 
                          severity={getStateSeverity(tool.state) as any}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.summary.mcpServers.length > 0 && (
                <div className="import-summary-section">
                  <h3 className="import-section-title">
                    {t('mcp_servers', 'MCP Servers')}
                  </h3>
                  <div className="import-summary-items">
                    {importResult.summary.mcpServers.map((server, idx) => (
                      <div key={idx} className="import-summary-item">
                        <span className="import-item-name">{server.name}</span>
                        <Badge 
                          value={getStateLabel(server.state)} 
                          severity={getStateSeverity(server.state) as any}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(importResult.summary.agents.some(a => a.state === 'ENABLED' || a.state === 'DISABLED') ||
              importResult.summary.tools.some(t => t.state === 'ENABLED' || t.state === 'DISABLED') || 
              importResult.summary.mcpServers.some(s => s.state === 'ENABLED' || s.state === 'DISABLED')) && (
              <div className="import-summary-note">
                <p>
                  {t('token_required_note', 'Please make sure that required tokens are provided before enabling the imported entities.')}
                </p>
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
              <p className="drop-zone-title">
                {t('drag_drop_file', 'Drag & drop your JSON file here')}
              </p>
              <p className="drop-zone-subtitle">
                {t('or_click_to_browse', 'or click to browse files')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ImportAgentDialog;

