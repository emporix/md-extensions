import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../utils/errorHelpers';

export interface UseDeleteConfirmationResult {
  deleteConfirmVisible: boolean;
  itemToDelete: string | null;
  showDeleteConfirm: (itemId: string) => void;
  hideDeleteConfirm: () => void;
  confirmDelete: () => Promise<void>;
}

export interface UseDeleteConfirmationOptions {
  onDelete: (itemId: string) => Promise<void>;
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
  const { showSuccess, showError } = useToast();

  const showDeleteConfirm = useCallback((itemId: string) => {
    setItemToDelete(itemId);
    setDeleteConfirmVisible(true);
  }, []);

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await onDelete(itemToDelete);
      onSuccess(itemToDelete);
      showSuccess(successMessage);
      hideDeleteConfirm();
    } catch (err) {
      const errorMsg = formatApiError(err, errorMessage);
      showError(`Error deleting item: ${errorMsg}`);
      hideDeleteConfirm();
    }
  }, [itemToDelete, onDelete, onSuccess, successMessage, errorMessage, showSuccess, showError, hideDeleteConfirm]);

  return {
    deleteConfirmVisible,
    itemToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
  };
};
