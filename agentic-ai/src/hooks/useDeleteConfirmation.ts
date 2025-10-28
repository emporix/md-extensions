import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../utils/errorHelpers';
import { ApiClientError } from '../services/apiClient';

export interface UseDeleteConfirmationResult {
  deleteConfirmVisible: boolean;
  itemToDelete: string | null;
  showDeleteConfirm: (itemId: string) => void;
  hideDeleteConfirm: () => void;
  confirmDelete: () => Promise<void>;
  forceDeleteConfirmVisible: boolean;
  hideForceDeleteConfirm: () => void;
  confirmForceDelete: () => Promise<void>;
}

export interface UseDeleteConfirmationOptions {
  onDelete: (itemId: string, force?: boolean) => Promise<void>;
  onSuccess: (itemId: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useDeleteConfirmation = ({
  onDelete,
  onSuccess,
  successMessage = 'Item deleted successfully!',
  errorMessage = 'Failed to delete item'
}: UseDeleteConfirmationOptions): UseDeleteConfirmationResult => {
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [forceDeleteConfirmVisible, setForceDeleteConfirmVisible] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const showDeleteConfirm = useCallback((itemId: string) => {
    setItemToDelete(itemId);
    setDeleteConfirmVisible(true);
  }, []);

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  }, []);

  const hideForceDeleteConfirm = useCallback(() => {
    setForceDeleteConfirmVisible(false);
    setPendingItemId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await onDelete(itemToDelete, false);
      onSuccess(itemToDelete);
      showSuccess(successMessage);
      hideDeleteConfirm();
    } catch (err) {
      if (err instanceof ApiClientError && err.force) {
        setPendingItemId(itemToDelete);
        setForceDeleteConfirmVisible(true);
        hideDeleteConfirm();
        return;
      }
      
      const errorMsg = formatApiError(err, errorMessage);
      showError(`Error deleting item: ${errorMsg}`);
      hideDeleteConfirm();
    }
  }, [itemToDelete, onDelete, onSuccess, successMessage, errorMessage, showSuccess, showError, hideDeleteConfirm]);

  const confirmForceDelete = useCallback(async () => {
    if (!pendingItemId) return;

    try {
      await onDelete(pendingItemId, true);
      onSuccess(pendingItemId);
      showSuccess(successMessage);
      hideForceDeleteConfirm();
    } catch (err) {
      const errorMsg = formatApiError(err, errorMessage);
      showError(`Error deleting item: ${errorMsg}`);
      hideForceDeleteConfirm();
    }
  }, [pendingItemId, onDelete, onSuccess, successMessage, errorMessage, showSuccess, showError, hideForceDeleteConfirm]);

  return {
    deleteConfirmVisible,
    itemToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  };
};
