import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GrantType } from '../types/Agent'
import { CodeChallengeMethod, OAuth } from '../types/OAuth'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import {
  connectOAuth as connectOAuthApi,
  upsertOAuth as upsertOAuthApi,
} from '../services/oauthService'
import { formatApiError } from '../utils/errorHelpers'
import { sanitizeIdInput } from '../utils/validation'

interface UseOAuthConfigProps {
  oauth: OAuth | null
  isCreating: boolean
  onSave: () => void
}

interface OAuthConfigState {
  oauthId: string
  tokenUrl: string
  authorizationUrl: string
  clientId: string
  grantType: GrantType | ''
  scope: string
  clientSecretTokenId: string
  codeChallengeMethod: CodeChallengeMethod | ''
  status: string
  enabled: boolean
}

export type OAuthConfigField = keyof OAuthConfigState

const buildOAuthPayload = (state: OAuthConfigState): OAuth | null => {
  if (!state.grantType) {
    return null
  }

  return {
    id: state.oauthId,
    tokenUrl: state.tokenUrl.trim(),
    clientId: state.clientId.trim(),
    grantType: state.grantType,
    enabled: state.enabled,
    ...(state.scope.trim() ? { scope: state.scope.trim() } : {}),
    ...(state.clientSecretTokenId
      ? { clientSecretToken: { id: state.clientSecretTokenId } }
      : {}),
    ...(state.grantType === GrantType.AUTHORIZATION_CODE
      ? {
          authorizationUrl: state.authorizationUrl.trim(),
          ...(state.codeChallengeMethod
            ? { codeChallengeMethod: state.codeChallengeMethod }
            : {}),
        }
      : {}),
  }
}

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
    tokenUrl: '',
    authorizationUrl: '',
    clientId: '',
    grantType: GrantType.CLIENT_CREDENTIALS,
    scope: '',
    clientSecretTokenId: '',
    codeChallengeMethod: '',
    status: '',
    enabled: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (oauth) {
      setState({
        oauthId: oauth.id ?? '',
        tokenUrl: oauth.tokenUrl ?? '',
        authorizationUrl: oauth.authorizationUrl ?? '',
        clientId: oauth.clientId ?? '',
        grantType: oauth.grantType || GrantType.CLIENT_CREDENTIALS,
        scope: oauth.scope ?? '',
        clientSecretTokenId: oauth.clientSecretToken?.id ?? '',
        codeChallengeMethod:
          oauth.codeChallengeMethod ||
          (oauth.grantType === GrantType.AUTHORIZATION_CODE
            ? CodeChallengeMethod.S256
            : ''),
        status: oauth.status ?? '',
        enabled: oauth.enabled !== false,
      })
    }
  }, [oauth])

  const updateField = useCallback(
    (
      field: OAuthConfigField,
      value: string | boolean | GrantType | CodeChallengeMethod
    ) => {
      setState((prev) => {
        const next: OAuthConfigState = {
          ...prev,
          [field]:
            field === 'oauthId' && typeof value === 'string'
              ? sanitizeIdInput(value)
              : value,
        }

        if (field === 'grantType') {
          if (value === GrantType.AUTHORIZATION_CODE) {
            next.codeChallengeMethod =
              prev.codeChallengeMethod || CodeChallengeMethod.S256
          } else {
            next.codeChallengeMethod = ''
            next.authorizationUrl = ''
          }
        }

        return next
      })
    },
    []
  )

  const isFormValid = useCallback(() => {
    if (!state.tokenUrl.trim() || !state.clientId.trim() || !state.grantType) {
      return false
    }

    if (isCreating && !state.oauthId.trim()) {
      return false
    }

    if (state.grantType === GrantType.AUTHORIZATION_CODE) {
      if (!state.authorizationUrl.trim() || !state.codeChallengeMethod) {
        return false
      }
    }

    return true
  }, [
    isCreating,
    state.authorizationUrl,
    state.clientId,
    state.codeChallengeMethod,
    state.grantType,
    state.oauthId,
    state.tokenUrl,
  ])

  const handleSave = useCallback(async () => {
    if (!oauth || !isFormValid()) {
      return
    }

    const updatedOAuth = buildOAuthPayload(state)
    if (!updatedOAuth) {
      return
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
    state,
    t,
  ])

  const handleSaveAndConnect = useCallback(async () => {
    if (
      !oauth ||
      !isFormValid() ||
      !state.enabled ||
      state.grantType !== GrantType.AUTHORIZATION_CODE
    ) {
      return
    }

    const updatedOAuth = buildOAuthPayload(state)
    if (!updatedOAuth) {
      return
    }

    try {
      setSaving(true)
      await upsertOAuthApi(appState, updatedOAuth)
      const connectResponse = await connectOAuthApi(appState, updatedOAuth.id)
      if (!connectResponse.authorizationUrl) {
        throw new Error(t('error_connecting_oauth'))
      }
      window.location.href = connectResponse.authorizationUrl
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_connecting_oauth'))
      showError(`${t('error_connecting_oauth')}: ${errorMessage}`)
      setSaving(false)
    }
  }, [appState, isFormValid, oauth, showError, state, t])

  return {
    state,
    saving,
    updateField,
    handleSave,
    handleSaveAndConnect,
    isFormValid: isFormValid(),
    isAuthorizationCode: state.grantType === GrantType.AUTHORIZATION_CODE,
  }
}
