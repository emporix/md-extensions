import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Token } from '../types/Token'
import { AppState } from '../types/common'
import { useToast } from '../contexts/ToastContext'
import { upsertToken as upsertTokenApi } from '../services/tokensService'
import { formatApiError } from '../utils/errorHelpers'
import { sanitizeIdInput } from '../utils/validation'

interface UseTokenConfigProps {
  token: Token | null
  isCreating: boolean
  appState: AppState
  onSave: () => void
}

interface TokenConfigState {
  tokenId: string
  tokenName: string
  tokenValue: string
}

export type TokenConfigField = keyof TokenConfigState

export const useTokenConfig = ({
  token,
  isCreating,
  appState,
  onSave,
}: UseTokenConfigProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [state, setState] = useState<TokenConfigState>({
    tokenId: '',
    tokenName: '',
    tokenValue: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (token) {
      setState({
        tokenId: token.id ?? '',
        tokenName: token.name ?? '',
        tokenValue: token.value ?? '',
      })
    }
  }, [token])

  const updateField = useCallback((field: TokenConfigField, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: field === 'tokenId' ? sanitizeIdInput(value) : value,
    }))
  }, [])

  const isFormValid = useCallback(() => {
    if (!state.tokenName.trim()) {
      return false
    }

    if (isCreating) {
      return !!state.tokenId.trim() && !!state.tokenValue.trim()
    }

    return true
  }, [isCreating, state.tokenId, state.tokenName, state.tokenValue])

  const handleSave = useCallback(async () => {
    if (!token || !isFormValid()) {
      return
    }

    const updatedToken: Token = {
      ...token,
      id: state.tokenId,
      name: state.tokenName,
      ...(isCreating ? { value: state.tokenValue } : {}),
    }

    try {
      setSaving(true)
      await upsertTokenApi(appState, updatedToken)
      showSuccess(
        isCreating
          ? t('token_created_successfully')
          : t('token_updated_successfully')
      )
      onSave()
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_saving_token'))
      showError(`${t('error_saving_token')}: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }, [
    appState,
    isCreating,
    isFormValid,
    onSave,
    showError,
    showSuccess,
    state.tokenId,
    state.tokenName,
    state.tokenValue,
    t,
    token,
  ])

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid(),
  }
}
