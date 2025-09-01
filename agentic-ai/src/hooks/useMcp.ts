import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { McpServer } from '../types/Mcp';
import { McpService } from '../services/mcpService';
import { AppState } from '../types/common';
import { useToast } from '../contexts/ToastContext';

export const useMcp = (appState: AppState) => {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [mcpServerToDelete, setMcpServerToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const mcpService = new McpService(appState);

  const loadMcpServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMcpServers = await mcpService.getMcpServers();
      setMcpServers(fetchedMcpServers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MCP servers');
      console.error('Error loading MCP servers:', err);
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token]);

  const upsertMcpServer = useCallback(async (updatedMcpServer: McpServer) => {
    try {
      const savedMcpServer = await mcpService.upsertMcpServer(updatedMcpServer);
      setMcpServers(prevMcpServers => {
        const existingIndex = prevMcpServers.findIndex(m => m.id === updatedMcpServer.id);
        if (existingIndex >= 0) {
          // Update existing MCP server
          return prevMcpServers.map(mcpServer => 
            mcpServer.id === savedMcpServer.id ? savedMcpServer : mcpServer
          );
        } else {
          // Add new MCP server
          return [...prevMcpServers, savedMcpServer];
        }
      });
      return savedMcpServer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upsert MCP server');
      throw err;
    }
  }, []);

  const removeMcpServer = useCallback((mcpServerId: string) => {
    setMcpServerToDelete(mcpServerId);
    setDeleteConfirmVisible(true);
  }, []);

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false);
    setMcpServerToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!mcpServerToDelete) return;

    try {
      await mcpService.deleteMcpServer(mcpServerToDelete);
      
      // Remove from local state
      setMcpServers(prev => prev.filter(mcpServer => mcpServer.id !== mcpServerToDelete));
      
      showSuccess(t('mcp_server_deleted_successfully', 'MCP Server deleted successfully!'));
      
      // Hide confirmation dialog
      hideDeleteConfirm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete MCP server';
      showError(`Error deleting MCP server: ${errorMessage}`);
      hideDeleteConfirm();
    }
  }, [mcpServerToDelete, mcpService, showSuccess, showError, hideDeleteConfirm]);

  const refreshMcpServers = useCallback(() => {
    loadMcpServers();
  }, [loadMcpServers]);

  useEffect(() => {
    loadMcpServers();
  }, [loadMcpServers]);

  return {
    mcpServers,
    loading,
    error,
    upsertMcpServer,
    refreshMcpServers,
    removeMcpServer,
    deleteConfirmVisible,
    mcpServerToDelete,
    hideDeleteConfirm,
    confirmDelete,
  };
};
