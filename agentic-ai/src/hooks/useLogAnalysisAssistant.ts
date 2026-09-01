import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import {
  LOG_ANALYSIS_ASSISTANT_I18N_KEYS,
  LOG_ANALYSIS_ASSISTANT_I18N_MESSAGES,
  buildLogAnalysisInitialMessage,
  createChatMessageId,
  extractLogAnalysisDisplayText,
  type LogAnalysisEntry,
} from '../utils/logAnalysisAssistantHelpers'
import { useAppState } from '../contexts/AppStateContext'
import {
  LOG_ANALYSIS_ASSISTANT_AGENT_ID,
  chatWithAgent,
  createLogAnalysisAssistantAgent,
} from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'
import { useHelperAgentProvisioning } from './useHelperAgentProvisioning'

export type LogAnalysisChatMessage = {
  readonly id: string
  readonly role: 'user' | 'assistant' | 'error'
  readonly content: string
}

const isAssistantServiceI18nMessage = (message: string): boolean =>
  LOG_ANALYSIS_ASSISTANT_I18N_MESSAGES.includes(message)

const LOG_ANALYSIS_HELPER_I18N_KEYS = {
  agentCreated: 'log_analysis_assistant_agent_created',
  agentExists: 'log_analysis_assistant_agent_exists',
  createFailed: 'log_analysis_assistant_create_failed',
  enableFailed: 'log_analysis_assistant_enable_failed',
} as const

export interface UseLogAnalysisAssistantParams {
  readonly visible: boolean
  readonly logMessages: readonly LogAnalysisEntry[]
}

export const useLogAnalysisAssistant = ({
  visible,
  logMessages,
}: UseLogAnalysisAssistantParams) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showError } = useToast()

  const [messages, setMessages] = useState<LogAnalysisChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [working, setWorking] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [toolName, setToolName] = useState<string | null>(null)

  const sessionIdRef = useRef<string | undefined>()
  const hasStartedAnalysisRef = useRef(false)

  const resolveAssistantErrorMessage = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof Error && isAssistantServiceI18nMessage(err.message)) {
        return t(err.message)
      }
      return extractLogAnalysisDisplayText(formatApiError(err, t(fallbackKey)))
    },
    [t]
  )

  const { helperAgentPresent, provisioningAgent, handleEnableHelperAgent } =
    useHelperAgentProvisioning({
      agentId: LOG_ANALYSIS_ASSISTANT_AGENT_ID,
      shouldCheck: visible,
      createAgent: createLogAnalysisAssistantAgent,
      i18nKeys: LOG_ANALYSIS_HELPER_I18N_KEYS,
      resolveErrorMessage: resolveAssistantErrorMessage,
    })

  useEffect(() => {
    hasStartedAnalysisRef.current = false
  }, [appState.tenant])

  const handleSendMessage = useCallback(
    async (text: string, displayContent?: string) => {
      const trimmed = text.trim()
      if (!trimmed || working) {
        return
      }

      const userMessage: LogAnalysisChatMessage = {
        id: createChatMessageId(),
        role: 'user',
        content: displayContent ?? trimmed,
      }

      setMessages((current) => [...current, userMessage])
      setInputValue('')
      setWorking(true)
      setStreamText('')
      setToolName(null)

      try {
        const reply = await chatWithAgent(
          appState,
          LOG_ANALYSIS_ASSISTANT_AGENT_ID,
          trimmed,
          {
            emptyResponseKey: LOG_ANALYSIS_ASSISTANT_I18N_KEYS.emptyResponse,
            sessionId: sessionIdRef.current,
            onToken: setStreamText,
            onToolActivity: setToolName,
            onSessionId: (sessionId) => {
              sessionIdRef.current = sessionId
            },
          }
        )

        setMessages((current) => [
          ...current,
          {
            id: createChatMessageId(),
            role: 'assistant',
            content: extractLogAnalysisDisplayText(reply),
          },
        ])
      } catch (err) {
        const errorMessage = resolveAssistantErrorMessage(
          err,
          'log_analysis_assistant_chat_failed'
        )
        showError(errorMessage)
        setMessages((current) => [
          ...current,
          {
            id: createChatMessageId(),
            role: 'error',
            content: errorMessage,
          },
        ])
      } finally {
        setWorking(false)
        setStreamText('')
        setToolName(null)
      }
    },
    [appState, resolveAssistantErrorMessage, showError, working]
  )

  const handleStartAnalysis = useCallback(async () => {
    if (logMessages.length === 0 || working) {
      return
    }

    await handleSendMessage(
      buildLogAnalysisInitialMessage(logMessages),
      t('log_analysis_starting', { count: logMessages.length })
    )
  }, [handleSendMessage, logMessages, t, working])

  useEffect(() => {
    if (
      !visible ||
      helperAgentPresent !== true ||
      hasStartedAnalysisRef.current ||
      logMessages.length === 0
    ) {
      return
    }

    hasStartedAnalysisRef.current = true
    void handleStartAnalysis()
  }, [visible, helperAgentPresent, logMessages.length, handleStartAnalysis])

  const resetState = useCallback(() => {
    setMessages([])
    setInputValue('')
    setStreamText('')
    setToolName(null)
    sessionIdRef.current = undefined
    hasStartedAnalysisRef.current = false
  }, [])

  return {
    messages,
    inputValue,
    setInputValue,
    helperAgentPresent,
    provisioningAgent,
    working,
    streamText,
    toolName,
    handleEnableHelperAgent,
    handleSendMessage,
    resetState,
  }
}
