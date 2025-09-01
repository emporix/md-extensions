import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tool } from '../types/Tool';
import { ToolsService } from '../services/toolsService';
import { AppState } from '../types/common';
import { useToast } from '../contexts/ToastContext';

export const useTools = (appState: AppState) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const toolsService = new ToolsService(appState);

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTools = await toolsService.getTools();
      setTools(fetchedTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
      console.error('Error loading tools:', err);
    } finally {
      setLoading(false);
    }
  }, [appState.tenant, appState.token]);

  const updateTool = useCallback(async (updatedTool: Tool) => {
    try {
      const savedTool = await toolsService.updateTool(updatedTool);
      setTools(prevTools => {
        const existingIndex = prevTools.findIndex(t => t.id === updatedTool.id);
        if (existingIndex >= 0) {
          // Update existing tool
          return prevTools.map(tool => 
            tool.id === savedTool.id ? savedTool : tool
          );
        } else {
          // Add new tool
          return [...prevTools, savedTool];
        }
      });
      return savedTool;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool');
      throw err;
    }
  }, []);

  const removeTool = useCallback((toolId: string) => {
    setToolToDelete(toolId);
    setDeleteConfirmVisible(true);
  }, []);

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false);
    setToolToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!toolToDelete) return;

    try {
      await toolsService.deleteTool(toolToDelete);
      
      // Remove from local state
      setTools(prev => prev.filter(tool => tool.id !== toolToDelete));
      
      showSuccess(t('tool_deleted_successfully', 'Tool deleted successfully!'));
      
      // Hide confirmation dialog
      hideDeleteConfirm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tool';
      showError(`Error deleting tool: ${errorMessage}`);
      hideDeleteConfirm();
    }
  }, [toolToDelete, toolsService, showSuccess, showError, hideDeleteConfirm]);

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
