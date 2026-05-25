import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import {
  COMMERCE_FILTER_ASSISTANT_I18N_MESSAGES,
  type AgentCommerceFilterDsl,
  extractFilterDslJsonFromAgentMessage,
} from '../utils/agentFilterDslHelpers'
import type { AppState } from '../types/common'
import {
  COMMERCE_FILTER_DSL_AGENT_ID,
  chatWithAgent,
  createCommerceFilterDslAgent,
  getCustomAgents,
  patchCustomAgent,
} from '../services/agentService'
import { ApiClientError } from '../services/apiClient'
import { formatApiError } from '../utils/errorHelpers'

type EditorTab = 'form' | 'json' | 'assistant'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  COMMERCE_FILTER_ASSISTANT_I18N_MESSAGES.includes(message)

export interface UseCommerceFilterDslAssistantParams {
  appState: AppState | undefined
  activeTab: EditorTab
  tryCommitParsedFilter: (
    parsed: unknown,
    onFail: (message: string) => void
  ) => AgentCommerceFilterDsl | null
  onApplyGeneratedDsl: (dsl: AgentCommerceFilterDsl) => void
}

export const useCommerceFilterDslAssistant = ({
  appState,
  activeTab,
  tryCommitParsedFilter,
  onApplyGeneratedDsl,
}: UseCommerceFilterDslAssistantParams) => {
  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useToast()

  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [helperAgentPresent, setHelperAgentPresent] = useState<boolean | null>(
    null
  )
  const [provisioningAgent, setProvisioningAgent] = useState(false)
  const [assistantWorking, setAssistantWorking] = useState(false)

  const resolveAssistantErrorMessage = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof Error && isAssistantServiceI18nMessage(err.message)) {
        return t(err.message)
      }
      return formatApiError(err, t(fallbackKey))
    },
    [t]
  )

  useEffect(() => {
    setHelperAgentPresent(null)
  }, [appState?.tenant])

  useEffect(() => {
    if (activeTab !== 'assistant' || !appState || helperAgentPresent !== null) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const agents = await getCustomAgents(appState)
        if (!cancelled) {
          setHelperAgentPresent(
            agents.some((a) => a.id === COMMERCE_FILTER_DSL_AGENT_ID)
          )
        }
      } catch {
        if (!cancelled) {
          setHelperAgentPresent(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab, appState, helperAgentPresent])

  const handleEnableHelperAgent = useCallback(async () => {
    if (!appState) return
    setProvisioningAgent(true)
    setAssistantError(null)
    try {
      await createCommerceFilterDslAgent(appState)
      setHelperAgentPresent(true)
      showSuccess(t('commerce_filter_assistant_agent_created'))
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        try {
          await patchCustomAgent(appState, COMMERCE_FILTER_DSL_AGENT_ID, [
            { op: 'REPLACE', path: '/enabled', value: true },
          ])
          setHelperAgentPresent(true)
          showInfo(t('commerce_filter_assistant_agent_exists'))
        } catch (patchErr) {
          showError(
            resolveAssistantErrorMessage(
              patchErr,
              'commerce_filter_assistant_enable_failed'
            )
          )
        }
      } else {
        showError(
          resolveAssistantErrorMessage(
            err,
            'commerce_filter_assistant_create_failed'
          )
        )
      }
    } finally {
      setProvisioningAgent(false)
    }
  }, [
    appState,
    resolveAssistantErrorMessage,
    showError,
    showInfo,
    showSuccess,
    t,
  ])

  const handleAssistantGenerate = useCallback(async () => {
    if (!appState || !assistantPrompt.trim()) return
    setAssistantWorking(true)
    setAssistantError(null)
    try {
      const reply = await chatWithAgent(
        appState,
        COMMERCE_FILTER_DSL_AGENT_ID,
        assistantPrompt.trim()
      )
      const extracted = extractFilterDslJsonFromAgentMessage(reply)
      if (!extracted) {
        setAssistantError(t('commerce_filter_assistant_extract_failed'))
        return
      }
      const dsl = tryCommitParsedFilter(extracted.parsed, (msg) =>
        setAssistantError(msg)
      )
      if (dsl) {
        onApplyGeneratedDsl(dsl)
        showSuccess(t('commerce_filter_assistant_applied'))
      }
    } catch (err) {
      showError(
        resolveAssistantErrorMessage(
          err,
          'commerce_filter_assistant_chat_failed'
        )
      )
    } finally {
      setAssistantWorking(false)
    }
  }, [
    appState,
    assistantPrompt,
    onApplyGeneratedDsl,
    resolveAssistantErrorMessage,
    showError,
    showSuccess,
    t,
    tryCommitParsedFilter,
  ])

  return {
    assistantPrompt,
    setAssistantPrompt,
    assistantError,
    setAssistantError,
    helperAgentPresent,
    provisioningAgent,
    assistantWorking,
    handleEnableHelperAgent,
    handleAssistantGenerate,
  }
}
