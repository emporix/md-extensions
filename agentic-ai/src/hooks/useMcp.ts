import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { McpServer } from '../types/Mcp';
import { AppState } from '../types/common';
import { formatApiError } from '../utils/errorHelpers';
import { ServiceFactory } from '../services/serviceFactory';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useUpsertItem } from './useUpsertItem';

export const useMcp = (appState: AppState) => {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const mcpService = useMemo(() => ServiceFactory.getMcpService(appState), [appState]);

  const {
    deleteConfirmVisible,
    itemToDelete: mcpServerToDelete,
    showDeleteConfirm: removeMcpServer,
    hideDeleteConfirm,
    confirmDelete
  } = useDeleteConfirmation({
    onDelete: async (mcpServerId: string) => {
      await mcpService.deleteMcpServer(mcpServerId)
    },
    onSuccess: (mcpServerId: string) => {
      setMcpServers(prev => prev.filter(server => server.id !== mcpServerId))
    },
    successMessage: t('mcp_server_deleted_successfully', 'MCP Server deleted successfully!'),
    errorMessage: 'Failed to delete MCP server'
  });

  const upsertMcpServer = useUpsertItem({
    onUpsert: (server: McpServer) => mcpService.upsertMcpServer(server),
    updateItems: setMcpServers,
    setError: undefined,
    getId: (server: McpServer) => server.id
  });

  const loadMcpServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMcpServers = await mcpService.getMcpServers();
      setMcpServers(fetchedMcpServers);
    } catch (err) {
      const message = formatApiError(err, 'Failed to load MCP servers');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mcpService]);

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
