import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import ToolCard from './ToolCard';
import ToolConfigPanel from './ToolConfigPanel';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Tool } from '../../types/Tool';
import { useTools } from '../../hooks/useTools';
import { AppState } from '../../types/common';
import { createEmptyTool } from '../../utils/toolHelpers';

interface ToolsPageProps {
  appState?: AppState;
}

const ToolsPage: React.FC<ToolsPageProps> = ({ 
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
  }
}) => {
  const { t } = useTranslation();
  const { 
    tools, 
    loading, 
    error, 
    updateTool, 
    refreshTools, 
    removeTool, 
    deleteConfirmVisible, 
    hideDeleteConfirm, 
    confirmDelete 
  } = useTools(appState);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleConfigure = (tool: Tool) => {
    setSelectedTool(tool);
    setShowConfigPanel(true);
  };

  const handleAddNewTool = useCallback(() => {
    setSelectedTool(createEmptyTool());
    setShowConfigPanel(true);
  }, []);

  const handleConfigSave = async (updatedTool: Tool) => {
    try {
      await updateTool(updatedTool);
      await refreshTools();
      setShowConfigPanel(false);
      setSelectedTool(null);
    } catch (error) {
      // Error is already handled in ToolConfigPanel with toast notifications
      console.error('Failed to refresh tools after save:', error);
      setShowConfigPanel(false);
      setSelectedTool(null);
    }
  };

  const handleConfigClose = () => {
    setShowConfigPanel(false);
    setSelectedTool(null);
  };

  if (loading) {
    return (
      <div className="tools-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <ProgressSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tools-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Message severity="error" text={error} />
      </div>
    );
  }

  return (
    <div className="tools-page" style={{ padding: '24px'}}>
      <div className="tools-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 600, 
            color: '#111827', 
            margin: '0 0 8px 0' 
          }}>
            {t('tools', 'Tools')}
          </h1>
        </div>
        <Button
          label={t('add_new_tool', 'ADD NEW TOOL')}
          className="add-new-tool-button"
          onClick={handleAddNewTool}
        />
      </div>

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
        visible={deleteConfirmVisible}
        onHide={hideDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('delete_tool', 'Delete Tool')}
        message={t('delete_tool_confirmation', 'Are you sure you want to delete this tool? This action cannot be undone.')}
        confirmLabel={t('delete', 'Delete')}
        cancelLabel={t('cancel', 'Cancel')}
        severity="danger"
      />
    </div>
  );
};

export default ToolsPage;
