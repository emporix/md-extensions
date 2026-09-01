import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import {
  JSON_SCHEMA_ASSISTANT_I18N_KEYS,
  JSON_SCHEMA_ASSISTANT_I18N_MESSAGES,
  extractJsonSchemaFromAgentMessage,
} from '../utils/jsonSchemaAssistantHelpers'
import {
  getAgentOutputValidationMessage,
  validateAgentOutputJsonSchema,
} from '../utils/validateJsonSchema'
import { useAppState } from '../contexts/AppStateContext'
import {
  JSON_SCHEMA_ASSISTANT_AGENT_ID,
  chatWithAgent,
  createJsonSchemaAssistantAgent,
} from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'
import { useHelperAgentProvisioning } from './useHelperAgentProvisioning'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  JSON_SCHEMA_ASSISTANT_I18N_MESSAGES.includes(message)

const JSON_SCHEMA_HELPER_I18N_KEYS = {
  agentCreated: 'json_schema_assistant_agent_created',
  agentExists: 'json_schema_assistant_agent_exists',
  createFailed: 'json_schema_assistant_create_failed',
  enableFailed: 'json_schema_assistant_enable_failed',
} as const

export interface UseJsonSchemaAssistantParams {
  visible: boolean
  onApplyGeneratedSchema: (formattedSchema: string) => void
  onClose: () => void
}

export const useJsonSchemaAssistant = ({
  visible,
  onApplyGeneratedSchema,
  onClose,
}: UseJsonSchemaAssistantParams) => {
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
      agentId: JSON_SCHEMA_ASSISTANT_AGENT_ID,
      shouldCheck: visible,
      createAgent: createJsonSchemaAssistantAgent,
      i18nKeys: JSON_SCHEMA_HELPER_I18N_KEYS,
      resolveErrorMessage: resolveAssistantErrorMessage,
      onBeforeEnable: handleBeforeEnableHelperAgent,
    })

  const handleAssistantGenerate = useCallback(async () => {
    if (!assistantPrompt.trim()) {
      return
    }

    setAssistantWorking(true)
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)
    try {
      const reply = await chatWithAgent(
        appState,
        JSON_SCHEMA_ASSISTANT_AGENT_ID,
        assistantPrompt.trim(),
        {
          emptyResponseKey: JSON_SCHEMA_ASSISTANT_I18N_KEYS.emptyResponse,
          onToken: setAssistantStreamText,
          onToolActivity: setAssistantToolName,
        }
      )
      const extracted = extractJsonSchemaFromAgentMessage(reply)
      if (!extracted) {
        setAssistantError(t('json_schema_assistant_extract_failed'))
        return
      }

      const validation = validateAgentOutputJsonSchema(extracted)
      if (!validation.valid) {
        setAssistantError(getAgentOutputValidationMessage(validation, t))
        return
      }

      onApplyGeneratedSchema(extracted)
      showSuccess(t('json_schema_assistant_applied'))
      setAssistantPrompt('')
      onClose()
    } catch (err) {
      showError(
        resolveAssistantErrorMessage(err, 'json_schema_assistant_chat_failed')
      )
    } finally {
      setAssistantWorking(false)
      setAssistantToolName(null)
    }
  }, [
    appState,
    assistantPrompt,
    onApplyGeneratedSchema,
    onClose,
    resolveAssistantErrorMessage,
    showError,
    showSuccess,
    t,
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
