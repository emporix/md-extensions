import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProjectCloudFunction } from '../types/Mcp'
import { useAppState } from '../contexts/AppStateContext'
import { getProjectFunctions } from '../services/hostingFunctionsService'

export const useProjectFunctions = (enabled = true) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const [functions, setFunctions] = useState<ProjectCloudFunction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureDisabled, setFeatureDisabled] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getProjectFunctions(appState)
      setFunctions(result.functions)
      setFeatureDisabled(result.featureDisabled)
    } catch {
      setFunctions([])
      setFeatureDisabled(false)
      setError(t('mcp_tool_functions_load_error'))
    } finally {
      setLoading(false)
    }
  }, [appState, enabled, t])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    functions,
    loading,
    error,
    featureDisabled,
    reload,
  }
}
