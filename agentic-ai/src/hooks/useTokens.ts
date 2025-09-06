import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Token } from '../types/Token';
import { AppState } from '../types/common';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../utils/errorHelpers';
import { ServiceFactory } from '../services/serviceFactory';

export const useTokens = (appState: AppState) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const tokensService = useMemo(() => ServiceFactory.getTokensService(appState), [appState]);

  const loadTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTokens = await tokensService.getTokens();
      setTokens(fetchedTokens);
    } catch (err) {
      const message = formatApiError(err, 'Failed to load tokens');
      setError(message);
      console.error('Error loading tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [tokensService]);

  const upsertToken = useCallback(async (updatedToken: Token) => {
    try {
      const savedToken = await tokensService.upsertToken(updatedToken);
      setTokens(prevTokens => {
        const existingIndex = prevTokens.findIndex(t => t.id === updatedToken.id);
        if (existingIndex >= 0) {
          // Update existing token
          return prevTokens.map(token => 
            token.id === savedToken.id ? savedToken : token
          );
        } else {
          // Add new token
          return [...prevTokens, savedToken];
        }
      });
      return savedToken;
    } catch (err) {
      const message = formatApiError(err, 'Failed to upsert token');
      setError(message);
      throw err;
    }
  }, [tokensService]);

  const removeToken = useCallback((tokenId: string) => {
    setTokenToDelete(tokenId);
    setDeleteConfirmVisible(true);
  }, []);

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false);
    setTokenToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!tokenToDelete) return;

    try {
      await tokensService.deleteToken(tokenToDelete);
      
      // Remove from local state
      setTokens(prev => prev.filter(token => token.id !== tokenToDelete));
      
      showSuccess(t('token_deleted_successfully', 'Token deleted successfully!'));
      
      // Hide confirmation dialog
      hideDeleteConfirm();
    } catch (err) {
      const errorMessage = formatApiError(err, 'Failed to delete token');
      showError(`Error deleting token: ${errorMessage}`);
      hideDeleteConfirm();
    }
  }, [tokenToDelete, tokensService, showSuccess, showError, hideDeleteConfirm, t]);

  const refreshTokens = useCallback(() => {
    loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  return {
    tokens,
    loading,
    error,
    upsertToken,
    refreshTokens,
    removeToken,
    deleteConfirmVisible,
    tokenToDelete,
    hideDeleteConfirm,
    confirmDelete,
  };
};
