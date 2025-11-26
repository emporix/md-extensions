import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Token } from '../types/Token'
import { AppState } from '../types/common'
import { formatApiError } from '../utils/errorHelpers'
import {
  deleteToken,
  upsertToken as upsertTokenApi,
  getTokens,
} from '../services/tokensService'
import { useDeleteConfirmation } from './useDeleteConfirmation'
import { useUpsertItem } from './useUpsertItem'

export const useTokens = (appState: AppState) => {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const {
    deleteConfirmVisible,
    showDeleteConfirm: removeToken,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  } = useDeleteConfirmation({
    onDelete: async (tokenId: string, force?: boolean) => {
      await deleteToken(appState, tokenId, force)
    },
    onSuccess: (tokenId: string) => {
      setTokens((prev) => prev.filter((token) => token.id !== tokenId))
    },
    successMessage: t(
      'token_deleted_successfully',
      'Token deleted successfully!'
    ),
    errorMessage: 'Failed to delete token',
  })

  const upsertToken = useUpsertItem({
    onUpsert: (token: Token) => upsertTokenApi(appState, token),
    updateItems: setTokens,
    setError: undefined,
    getId: (token: Token) => token.id,
  })

  const loadTokens = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedTokens = await getTokens(appState)
      setTokens(fetchedTokens)
    } catch (err) {
      const message = formatApiError(err, 'Failed to load tokens')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appState])

  const refreshTokens = useCallback(() => {
    loadTokens()
  }, [loadTokens])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

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
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  }
}
