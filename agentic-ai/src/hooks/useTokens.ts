import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Token } from '../types/Token';
import { AppState } from '../types/common';
import { formatApiError } from '../utils/errorHelpers';
import { ServiceFactory } from '../services/serviceFactory';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useUpsertItem } from './useUpsertItem';

export const useTokens = (appState: AppState) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const tokensService = useMemo(() => ServiceFactory.getTokensService(appState), [appState]);

  const {
    deleteConfirmVisible,
    showDeleteConfirm: removeToken,
    hideDeleteConfirm,
    confirmDelete
  } = useDeleteConfirmation({
    onDelete: async (tokenId: string) => {
      await tokensService.deleteToken(tokenId);
    },
    onSuccess: (tokenId: string) => {
      setTokens(prev => prev.filter(token => token.id !== tokenId));
    },
    successMessage: t('token_deleted_successfully', 'Token deleted successfully!'),
    errorMessage: 'Failed to delete token'
  });

  const upsertToken = useUpsertItem({
    onUpsert: (token: Token) => tokensService.upsertToken(token),
    updateItems: setTokens,
    setError: undefined,
    getId: (token: Token) => token.id
  });

  const loadTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTokens = await tokensService.getTokens();
      setTokens(fetchedTokens);
    } catch (err) {
      const message = formatApiError(err, 'Failed to load tokens');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tokensService]);


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
    hideDeleteConfirm,
    confirmDelete,
  };
};
