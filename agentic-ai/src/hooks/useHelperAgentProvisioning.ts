import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import { useAppState } from '../contexts/AppStateContext'
import { getCustomAgents, patchCustomAgent } from '../services/agentService'
import { ApiClientError } from '../services/apiClient'
import { formatApiError } from '../utils/errorHelpers'
import type { AppState } from '../types/common'

export type HelperAgentProvisioningI18nKeys = {
  readonly agentCreated: string
  readonly agentExists: string
  readonly createFailed: string
  readonly enableFailed: string
}

export const isEnabledAgentPresent = (
  agents: readonly { readonly id: string; readonly enabled?: boolean }[],
  agentId: string
): boolean =>
  agents.some((agent) => agent.id === agentId && agent.enabled === true)

export type UseHelperAgentProvisioningParams = {
  readonly agentId: string
  readonly shouldCheck: boolean
  readonly createAgent: (appState: AppState) => Promise<{ success: boolean }>
  readonly i18nKeys: HelperAgentProvisioningI18nKeys
  readonly resolveErrorMessage: (err: unknown, fallbackKey: string) => string
  readonly onBeforeEnable?: () => void
  readonly onEnabled?: () => void
}

export const useHelperAgentProvisioning = ({
  agentId,
  shouldCheck,
  createAgent,
  i18nKeys,
  resolveErrorMessage,
  onBeforeEnable,
  onEnabled,
}: UseHelperAgentProvisioningParams) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useToast()

  const [helperAgentPresent, setHelperAgentPresent] = useState<boolean | null>(
    null
  )
  const [provisioningAgent, setProvisioningAgent] = useState(false)

  useEffect(() => {
    setHelperAgentPresent(null)
  }, [appState.tenant])

  useEffect(() => {
    if (!shouldCheck || helperAgentPresent !== null) {
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const agents = await getCustomAgents(appState)
        if (!cancelled) {
          setHelperAgentPresent(isEnabledAgentPresent(agents, agentId))
        }
      } catch (err) {
        if (!cancelled) {
          setHelperAgentPresent(false)
          showError(
            formatApiError(err, t('helper_agent_availability_check_failed'))
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shouldCheck, appState, agentId, helperAgentPresent, showError, t])

  const handleEnableHelperAgent = useCallback(async () => {
    setProvisioningAgent(true)
    onBeforeEnable?.()
    try {
      await createAgent(appState)
      setHelperAgentPresent(true)
      onEnabled?.()
      showSuccess(t(i18nKeys.agentCreated))
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        try {
          await patchCustomAgent(appState, agentId, [
            { op: 'REPLACE', path: '/enabled', value: true },
          ])
          setHelperAgentPresent(true)
          onEnabled?.()
          showInfo(t(i18nKeys.agentExists))
        } catch (patchErr) {
          showError(resolveErrorMessage(patchErr, i18nKeys.enableFailed))
        }
      } else {
        showError(resolveErrorMessage(err, i18nKeys.createFailed))
      }
    } finally {
      setProvisioningAgent(false)
    }
  }, [
    agentId,
    appState,
    createAgent,
    i18nKeys,
    onBeforeEnable,
    onEnabled,
    resolveErrorMessage,
    showError,
    showInfo,
    showSuccess,
    t,
  ])

  return {
    helperAgentPresent,
    provisioningAgent,
    handleEnableHelperAgent,
  }
}
