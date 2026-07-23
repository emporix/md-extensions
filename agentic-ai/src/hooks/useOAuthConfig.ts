import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GrantType } from '../types/Agent'
import { OAuth } from '../types/OAuth'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import { upsertOAuth as upsertOAuthApi } from '../services/oauthService'
import { formatApiError } from '../utils/errorHelpers'
import { sanitizeIdInput } from '../utils/validation'

interface UseOAuthConfigProps {
  oauth: OAuth | null
  isCreating: boolean
  onSave: () => void
}

interface OAuthConfigState {
  oauthId: string
  url: string
  clientId: string
  grantType: GrantType | ''
  scope: string
  clientSecretTokenId: string
  enabled: boolean
}

export type OAuthConfigField = keyof OAuthConfigState

export const useOAuthConfig = ({
  oauth,
  isCreating,
  onSave,
}: UseOAuthConfigProps) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [state, setState] = useState<OAuthConfigState>({
    oauthId: '',
    url: '',
    clientId: '',
    grantType: GrantType.CLIENT_CREDENTIALS,
    scope: '',
    clientSecretTokenId: '',
    enabled: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (oauth) {
      setState({
        oauthId: oauth.id ?? '',
        url: oauth.url ?? '',
        clientId: oauth.clientId ?? '',
        grantType: oauth.grantType || GrantType.CLIENT_CREDENTIALS,
        scope: oauth.scope ?? '',
        clientSecretTokenId: oauth.clientSecretToken?.id ?? '',
        enabled: oauth.enabled !== false,
      })
    }
  }, [oauth])

  const updateField = useCallback(
    (field: OAuthConfigField, value: string | boolean | GrantType) => {
      setState((prev) => ({
        ...prev,
        [field]:
          field === 'oauthId' && typeof value === 'string'
            ? sanitizeIdInput(value)
            : value,
      }))
    },
    []
  )

  const isFormValid = useCallback(() => {
    if (
      !state.url.trim() ||
      !state.clientId.trim() ||
      !state.grantType
    ) {
      return false
    }

    if (isCreating && !state.oauthId.trim()) {
      return false
    }

    return true
  }, [isCreating, state.clientId, state.grantType, state.oauthId, state.url])

  const handleSave = useCallback(async () => {
    if (!oauth || !isFormValid() || !state.grantType) {
      return
    }

    const updatedOAuth: OAuth = {
      id: state.oauthId,
      url: state.url.trim(),
      clientId: state.clientId.trim(),
      grantType: state.grantType,
      enabled: state.enabled,
      ...(state.scope.trim() ? { scope: state.scope.trim() } : {}),
      ...(state.clientSecretTokenId
        ? { clientSecretToken: { id: state.clientSecretTokenId } }
        : {}),
    }

    try {
      setSaving(true)
      await upsertOAuthApi(appState, updatedOAuth)
      showSuccess(
        isCreating
          ? t('oauth_created_successfully')
          : t('oauth_updated_successfully')
      )
      onSave()
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_saving_oauth'))
      showError(`${t('error_saving_oauth')}: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }, [
    appState,
    isCreating,
    isFormValid,
    oauth,
    onSave,
    showError,
    showSuccess,
    state.clientId,
    state.clientSecretTokenId,
    state.enabled,
    state.grantType,
    state.oauthId,
    state.scope,
    state.url,
    t,
  ])

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid(),
  }
}
