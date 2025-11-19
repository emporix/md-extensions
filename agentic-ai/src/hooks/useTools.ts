import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tool } from '../types/Tool';
import { AppState } from '../types/common';
import { formatApiError } from '../utils/errorHelpers';
import { ServiceFactory } from '../services/serviceFactory';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useUpsertItem } from './useUpsertItem';
import { useToast } from '../contexts/ToastContext';
import { ApiClientError } from '../services/apiClient';

export const useTools = (appState: AppState) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRagFeatureEnabled, setIsRagFeatureEnabled] = useState<boolean>(true);
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [forceToggleConfirmVisible, setForceToggleConfirmVisible] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ toolId: string; enabled: boolean } | null>(null);

  const toolsService = useMemo(() => ServiceFactory.getToolsService(appState), [appState]);
  const featureToggleService = useMemo(() => ServiceFactory.getFeatureToggleService(appState), [appState]);

  const {
    deleteConfirmVisible,
    itemToDelete: toolToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete
  } = useDeleteConfirmation({
    onDelete: async (toolId: string, force?: boolean) => {
      await toolsService.deleteTool(toolId, force)
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

  const toggleToolActive = useCallback(async (toolId: string, enabled: boolean) => {
    try {
      const currentTool = tools.find(tool => tool.id === toolId);
      if (!currentTool) {
        throw new Error('Tool not found');
      }

      setTools(prev => 
        prev.map(tool => 
          tool.id === toolId ? { ...tool, enabled } : tool
        )
      );
      
      const patches = [
        {
          op: 'REPLACE',
          path: '/enabled',
          value: enabled
        }
      ];
      await toolsService.patchTool(toolId, patches, false);
      
      showSuccess(`Tool ${enabled ? 'activated' : 'deactivated'} successfully!`);
      
      await loadTools();
    } catch (err) {
      if (!enabled && err instanceof ApiClientError && err.force) {
        setPendingToggle({ toolId, enabled });
        setForceToggleConfirmVisible(true);
        setTools(prev => 
          prev.map(tool => 
            tool.id === toolId ? { ...tool, enabled: !enabled } : tool
          )
        );
        return;
      }
      
      const errorMessage = formatApiError(err, 'Failed to update tool status');
      showError(`Error updating tool: ${errorMessage}`);
      
      setTools(prev => 
        prev.map(tool => 
          tool.id === toolId ? { ...tool, enabled: !enabled } : tool
        )
      );
    }
  }, [tools, toolsService, showSuccess, showError]);

  const confirmForceToggle = useCallback(async () => {
    if (!pendingToggle) return;

    const { toolId, enabled } = pendingToggle;
    
    try {
      setTools(prev => 
        prev.map(tool => 
          tool.id === toolId ? { ...tool, enabled } : tool
        )
      );
      
      const patches = [
        {
          op: 'REPLACE',
          path: '/enabled',
          value: enabled
        }
      ];
      await toolsService.patchTool(toolId, patches, true);
      
      showSuccess(`Tool ${enabled ? 'activated' : 'deactivated'} successfully!`);
      setForceToggleConfirmVisible(false);
      setPendingToggle(null);
      
      await loadTools();
    } catch (err) {
      const errorMessage = formatApiError(err, 'Failed to update tool status');
      showError(`Error updating tool: ${errorMessage}`);
      
      setTools(prev => 
        prev.map(tool => 
          tool.id === toolId ? { ...tool, enabled: !enabled } : tool
        )
      );
      setForceToggleConfirmVisible(false);
      setPendingToggle(null);
    }
  }, [pendingToggle, toolsService, showSuccess, showError]);

  const hideForceToggleConfirm = useCallback(() => {
    setForceToggleConfirmVisible(false);
    setPendingToggle(null);
  }, []);

  const removeTool = useCallback((toolId: string) => {
    showDeleteConfirm(toolId);
  }, [showDeleteConfirm]);

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if RAG feature is enabled
      const ragEnabled = await featureToggleService.isRagFeatureEnabled();
      setIsRagFeatureEnabled(ragEnabled);
      
      const fetchedTools = await toolsService.getTools();
      
      // Filter out RAG tools if feature is disabled
      const filteredTools = ragEnabled 
        ? fetchedTools 
        : fetchedTools.filter(tool => tool.type !== 'rag_emporix' && tool.type !== 'rag_custom');
      
      setTools(filteredTools);
    } catch (err) {
      const message = formatApiError(err, 'Failed to load tools');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [toolsService, featureToggleService]);

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
    isRagFeatureEnabled,
    updateTool,
    refreshTools,
    removeTool,
    toggleToolActive,
    deleteConfirmVisible,
    toolToDelete,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  };
};
