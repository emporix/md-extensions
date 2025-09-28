import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tool } from '../types/Tool';
import { AppState } from '../types/common';
import { formatApiError } from '../utils/errorHelpers';
import { ServiceFactory } from '../services/serviceFactory';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useUpsertItem } from './useUpsertItem';

export const useTools = (appState: AppState) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const toolsService = useMemo(() => ServiceFactory.getToolsService(appState), [appState]);

  const {
    deleteConfirmVisible,
    itemToDelete: toolToDelete,
    showDeleteConfirm: removeTool,
    hideDeleteConfirm,
    confirmDelete
  } = useDeleteConfirmation({
    onDelete: async (toolId: string) => {
      await toolsService.deleteTool(toolId)
    },
    onSuccess: (toolId: string) => {
      setTools(prev => prev.filter(tool => tool.id !== toolId))
    },
    successMessage: t('tool_deleted_successfully', 'Tool deleted successfully!'),
    errorMessage: 'Failed to delete tool'
  });

  const updateTool = useUpsertItem({
    onUpsert: (tool: Tool) => toolsService.updateTool(tool),
    updateItems: setTools,
    setError: undefined,
    getId: (tool: Tool) => tool.id
  });

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTools = await toolsService.getTools();
      setTools(fetchedTools);
    } catch (err) {
      const message = formatApiError(err, 'Failed to load tools');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [toolsService]);

  const refreshTools = useCallback(() => {
    loadTools();
  }, [loadTools]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  return {
    tools,
    loading,
    error,
    updateTool,
    refreshTools,
    removeTool,
    deleteConfirmVisible,
    toolToDelete,
    hideDeleteConfirm,
    confirmDelete,
  };
};
