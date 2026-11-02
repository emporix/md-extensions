import { useTranslation } from 'react-i18next'
import { useIamScopesState } from '../contexts/IamScopesContext'

export const useMyIamScopes = (
  enabled = true,
  errorKey = 'event_scopes_load_error'
) => {
  const { t } = useTranslation()
  const { scopes, loading, failed, reload } = useIamScopesState()

  return {
    scopes: enabled ? scopes : [],
    loading: enabled && loading,
    error: enabled && failed ? t(errorKey) : null,
    reload,
  }
}
