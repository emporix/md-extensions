import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import {
  COMMERCE_FILTER_ASSISTANT_I18N_MESSAGES,
  type AgentCommerceFilterDsl,
  extractFilterDslJsonFromAgentMessage,
} from '../utils/agentFilterDslHelpers'
import { useAppState } from '../contexts/AppStateContext'
import {
  COMMERCE_FILTER_DSL_AGENT_ID,
  chatWithAgent,
  createCommerceFilterDslAgent,
} from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'
import { useHelperAgentProvisioning } from './useHelperAgentProvisioning'

type EditorTab = 'form' | 'json' | 'assistant'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  COMMERCE_FILTER_ASSISTANT_I18N_MESSAGES.includes(message)

const COMMERCE_FILTER_HELPER_I18N_KEYS = {
  agentCreated: 'commerce_filter_assistant_agent_created',
  agentExists: 'commerce_filter_assistant_agent_exists',
  createFailed: 'commerce_filter_assistant_create_failed',
  enableFailed: 'commerce_filter_assistant_enable_failed',
} as const

export interface UseCommerceFilterDslAssistantParams {
  activeTab: EditorTab
  tryCommitParsedFilter: (
    parsed: unknown,
    onFail: (message: string) => void
  ) => AgentCommerceFilterDsl | null
  onApplyGeneratedDsl: (dsl: AgentCommerceFilterDsl) => void
}

export const useCommerceFilterDslAssistant = ({
  activeTab,
  tryCommitParsedFilter,
  onApplyGeneratedDsl,
}: UseCommerceFilterDslAssistantParams) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()

  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [assistantWorking, setAssistantWorking] = useState(false)
  const [assistantStreamText, setAssistantStreamText] = useState('')
  const [assistantToolName, setAssistantToolName] = useState<string | null>(
    null
  )

  const resolveAssistantErrorMessage = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof Error && isAssistantServiceI18nMessage(err.message)) {
        return t(err.message)
      }
      return formatApiError(err, t(fallbackKey))
    },
    [t]
  )

  const handleBeforeEnableHelperAgent = useCallback(() => {
    setAssistantError(null)
  }, [])

  const { helperAgentPresent, provisioningAgent, handleEnableHelperAgent } =
    useHelperAgentProvisioning({
      agentId: COMMERCE_FILTER_DSL_AGENT_ID,
      shouldCheck: activeTab === 'assistant',
      createAgent: createCommerceFilterDslAgent,
      i18nKeys: COMMERCE_FILTER_HELPER_I18N_KEYS,
      resolveErrorMessage: resolveAssistantErrorMessage,
      onBeforeEnable: handleBeforeEnableHelperAgent,
    })

  const handleAssistantGenerate = useCallback(async () => {
    if (!assistantPrompt.trim()) return
    setAssistantWorking(true)
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)
    try {
      const reply = await chatWithAgent(
        appState,
        COMMERCE_FILTER_DSL_AGENT_ID,
        assistantPrompt.trim(),
        {
          onToken: setAssistantStreamText,
          onToolActivity: setAssistantToolName,
        }
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
      setAssistantToolName(null)
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

  const resetAssistantState = useCallback(() => {
    setAssistantPrompt('')
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)
  }, [])

  return {
    assistantPrompt,
    setAssistantPrompt,
    assistantError,
    setAssistantError,
    helperAgentPresent,
    provisioningAgent,
    assistantWorking,
    assistantStreamText,
    assistantToolName,
    handleEnableHelperAgent,
    handleAssistantGenerate,
    resetAssistantState,
  }
}
