import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OAuth } from '../types/OAuth'
import { useAppState } from '../contexts/AppStateContext'
import { formatApiError } from '../utils/errorHelpers'
import {
  deleteOAuth,
  getOAuths,
  upsertOAuth as upsertOAuthApi,
  patchOAuth,
} from '../services/oauthService'
import { useDeleteConfirmation } from './useDeleteConfirmation'
import { useUpsertItem } from './useUpsertItem'
import { useToast } from '../contexts/ToastContext'
import { ApiClientError } from '../services/apiClient'

export const useOAuths = () => {
  const appState = useAppState()
  const [oauths, setOAuths] = useState<OAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()

  const [forceToggleConfirmVisible, setForceToggleConfirmVisible] =
    useState(false)
  const [pendingToggle, setPendingToggle] = useState<{
    oauthId: string
    enabled: boolean
  } | null>(null)

  const {
    deleteConfirmVisible,
    showDeleteConfirm: removeOAuth,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  } = useDeleteConfirmation({
    onDelete: async (oauthId: string, force?: boolean) => {
      await deleteOAuth(appState, oauthId, force)
    },
    onSuccess: (oauthId: string) => {
      setOAuths((prev) => prev.filter((oauth) => oauth.id !== oauthId))
    },
    successMessage: t('oauth_deleted_successfully'),
    errorMessage: t('failed_to_delete_oauth'),
  })

  const loadOAuths = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedOAuths = await getOAuths(appState)
      setOAuths(fetchedOAuths)
    } catch (err) {
      const message = formatApiError(err, t('error_loading_oauths'))
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appState, t])

  const upsertOAuth = useUpsertItem({
    onUpsert: (oauth: OAuth) => upsertOAuthApi(appState, oauth),
    updateItems: setOAuths,
    setError: undefined,
    getId: (oauth: OAuth) => oauth.id,
  })

  const toggleOAuthActive = useCallback(
    async (oauthId: string, enabled: boolean) => {
      try {
        const currentOAuth = oauths.find((oauth) => oauth.id === oauthId)
        if (!currentOAuth) {
          throw new Error(t('oauth_not_found'))
        }

        setOAuths((prev) =>
          prev.map((oauth) =>
            oauth.id === oauthId ? { ...oauth, enabled } : oauth
          )
        )

        await patchOAuth(
          appState,
          oauthId,
          [{ op: 'REPLACE', path: '/enabled', value: enabled }],
          false
        )

        showSuccess(
          enabled
            ? t('oauth_activated_successfully')
            : t('oauth_deactivated_successfully')
        )

        await loadOAuths()
      } catch (err) {
        if (!enabled && err instanceof ApiClientError && err.force) {
          setPendingToggle({ oauthId, enabled })
          setForceToggleConfirmVisible(true)
          setOAuths((prev) =>
            prev.map((oauth) =>
              oauth.id === oauthId ? { ...oauth, enabled: !enabled } : oauth
            )
          )
          return
        }

        const errorMessage = formatApiError(err, t('error_updating_oauth'))
        showError(`${t('error_updating_oauth')}: ${errorMessage}`)

        setOAuths((prev) =>
          prev.map((oauth) =>
            oauth.id === oauthId ? { ...oauth, enabled: !enabled } : oauth
          )
        )
      }
    },
    [oauths, appState, showSuccess, showError, loadOAuths, t]
  )

  const confirmForceToggle = useCallback(async () => {
    if (!pendingToggle) return

    const { oauthId, enabled } = pendingToggle

    try {
      setOAuths((prev) =>
        prev.map((oauth) =>
          oauth.id === oauthId ? { ...oauth, enabled } : oauth
        )
      )

      await patchOAuth(
        appState,
        oauthId,
        [{ op: 'REPLACE', path: '/enabled', value: enabled }],
        true
      )

      showSuccess(
        enabled
          ? t('oauth_activated_successfully')
          : t('oauth_deactivated_successfully')
      )
      setForceToggleConfirmVisible(false)
      setPendingToggle(null)

      await loadOAuths()
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_updating_oauth'))
      showError(`${t('error_updating_oauth')}: ${errorMessage}`)

      setOAuths((prev) =>
        prev.map((oauth) =>
          oauth.id === oauthId ? { ...oauth, enabled: !enabled } : oauth
        )
      )
      setForceToggleConfirmVisible(false)
      setPendingToggle(null)
    }
  }, [pendingToggle, appState, showSuccess, showError, loadOAuths, t])

  const hideForceToggleConfirm = useCallback(() => {
    setForceToggleConfirmVisible(false)
    setPendingToggle(null)
  }, [])

  const refreshOAuths = useCallback(() => {
    loadOAuths()
  }, [loadOAuths])

  useEffect(() => {
    loadOAuths()
  }, [loadOAuths])

  return {
    oauths,
    loading,
    error,
    upsertOAuth,
    refreshOAuths,
    removeOAuth,
    toggleOAuthActive,
    deleteConfirmVisible,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  }
}
