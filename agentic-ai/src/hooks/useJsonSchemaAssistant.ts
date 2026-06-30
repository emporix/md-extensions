import { useCallback, useEffect, useState } from 'react'
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
  getCustomAgents,
  patchCustomAgent,
} from '../services/agentService'
import { ApiClientError } from '../services/apiClient'
import { formatApiError } from '../utils/errorHelpers'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  JSON_SCHEMA_ASSISTANT_I18N_MESSAGES.includes(message)

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
  }, [appState.tenant])

  useEffect(() => {
    if (!visible || helperAgentPresent !== null) {
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const agents = await getCustomAgents(appState)
        if (!cancelled) {
          setHelperAgentPresent(
            agents.some((agent) => agent.id === JSON_SCHEMA_ASSISTANT_AGENT_ID)
          )
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
  }, [visible, appState, helperAgentPresent, showError, t])

  const handleEnableHelperAgent = useCallback(async () => {
    setProvisioningAgent(true)
    setAssistantError(null)
    try {
      await createJsonSchemaAssistantAgent(appState)
      setHelperAgentPresent(true)
      showSuccess(t('json_schema_assistant_agent_created'))
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        try {
          await patchCustomAgent(appState, JSON_SCHEMA_ASSISTANT_AGENT_ID, [
            { op: 'REPLACE', path: '/enabled', value: true },
          ])
          setHelperAgentPresent(true)
          showInfo(t('json_schema_assistant_agent_exists'))
        } catch (patchErr) {
          showError(
            resolveAssistantErrorMessage(
              patchErr,
              'json_schema_assistant_enable_failed'
            )
          )
        }
      } else {
        showError(
          resolveAssistantErrorMessage(
            err,
            'json_schema_assistant_create_failed'
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
    if (!assistantPrompt.trim()) {
      return
    }

    setAssistantWorking(true)
    setAssistantError(null)
    try {
      const reply = await chatWithAgent(
        appState,
        JSON_SCHEMA_ASSISTANT_AGENT_ID,
        assistantPrompt.trim(),
        JSON_SCHEMA_ASSISTANT_I18N_KEYS.emptyResponse
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
  }, [])

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
    resetAssistantState,
  }
}
