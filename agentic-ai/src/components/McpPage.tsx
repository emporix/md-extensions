import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import McpCard from './McpCard';
import McpConfigPanel from './McpConfigPanel';
import { ConfirmDialog } from './common/ConfirmDialog';
import { McpServer } from '../types/Mcp';
import { useMcp } from '../hooks/useMcp';
import { AppState } from '../types/common';
import { createEmptyMcpServer } from '../utils/mcpHelpers';
import { useToast } from '../contexts/ToastContext';

interface McpPageProps {
  appState?: AppState;
}

const McpPage: React.FC<McpPageProps> = ({ 
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
  }
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const { 
    mcpServers, 
    loading, 
    error, 
    upsertMcpServer, 
    refreshMcpServers, 
    removeMcpServer, 
    deleteConfirmVisible, 
    hideDeleteConfirm, 
    confirmDelete 
  } = useMcp(appState);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedMcpServer, setSelectedMcpServer] = useState<McpServer | null>(null);

  const handleConfigure = (mcpServer: McpServer) => {
    setSelectedMcpServer(mcpServer);
    setShowConfigPanel(true);
  };

  const handleAddNewMcpServer = useCallback(() => {
    setSelectedMcpServer(createEmptyMcpServer());
    setShowConfigPanel(true);
  }, []);

  const handleConfigSave = async (updatedMcpServer: McpServer) => {
    try {
      await upsertMcpServer(updatedMcpServer);
      showSuccess(t('mcp_server_updated_successfully', 'MCP Server updated successfully!'));
      await refreshMcpServers();
      setShowConfigPanel(false);
      setSelectedMcpServer(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save MCP server';
      showError(`${t('error_saving_mcp_server', 'Error saving MCP server')}: ${errorMessage}`);
      console.error('Error saving MCP server:', error);
      setShowConfigPanel(false);
      setSelectedMcpServer(null);
    }
  };

  const handleConfigClose = () => {
    setShowConfigPanel(false);
    setSelectedMcpServer(null);
  };

  if (loading) {
    return (
      <div className="mcp-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <ProgressSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mcp-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Message severity="error" text={error} />
      </div>
    );
  }

  return (
    <div className="mcp-page" style={{ padding: '24px'}}>
      <div className="mcp-header" style={{ 
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
            {t('mcp_servers', 'MCP Servers')}
          </h1>
        </div>
        <Button
          label={t('add_new_mcp_server', 'ADD NEW MCP SERVER')}
          className="add-new-mcp-server-button"
          onClick={handleAddNewMcpServer}
        />
      </div>

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
      />

      <ConfirmDialog
        visible={deleteConfirmVisible}
        onHide={hideDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('delete_mcp_server', 'Delete MCP Server')}
        message={t('delete_mcp_server_confirmation', 'Are you sure you want to delete this MCP server? This action cannot be undone.')}
        confirmLabel={t('delete', 'Delete')}
        cancelLabel={t('cancel', 'Cancel')}
        severity="danger"
      />
    </div>
  );
};

export default McpPage;
