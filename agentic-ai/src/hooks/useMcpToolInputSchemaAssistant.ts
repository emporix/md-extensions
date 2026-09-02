import { useCallback, useEffect, useRef, useState } from 'react'
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
import { buildMcpToolInputSchemaPrompt } from '../utils/mcpToolInputSchemaPrompt.helpers'
import {
  MCP_TOOL_INPUT_SCHEMA_ZIP_I18N_KEYS,
  isFunctionZipI18nErrorKey,
  loadLatestFunctionZipSourceFiles,
} from '../utils/loadLatestFunctionZipSource.helpers'
import { useHelperAgentProvisioning } from './useHelperAgentProvisioning'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  JSON_SCHEMA_ASSISTANT_I18N_MESSAGES.includes(message)

const JSON_SCHEMA_HELPER_I18N_KEYS = {
  agentCreated: 'json_schema_assistant_agent_created',
  agentExists: 'json_schema_assistant_agent_exists',
  createFailed: 'json_schema_assistant_create_failed',
  enableFailed: 'json_schema_assistant_enable_failed',
} as const

export type McpToolInputSchemaAssistantContext = {
  functionId: string
  toolName: string
  toolDescription?: string
  httpMethod: string
  argsLocation?: string
}

export interface UseMcpToolInputSchemaAssistantParams {
  visible: boolean
  context: McpToolInputSchemaAssistantContext
  onApplyGeneratedSchema: (formattedSchema: string) => void
  onClose: () => void
}

const isZipOrAssistantI18nKey = (message: string): boolean =>
  isAssistantServiceI18nMessage(message) ||
  isFunctionZipI18nErrorKey(message, MCP_TOOL_INPUT_SCHEMA_ZIP_I18N_KEYS)

export const useMcpToolInputSchemaAssistant = ({
  visible,
  context,
  onApplyGeneratedSchema,
  onClose,
}: UseMcpToolInputSchemaAssistantParams) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()

  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [assistantWorking, setAssistantWorking] = useState(false)
  const [assistantStreamText, setAssistantStreamText] = useState('')
  const [assistantToolName, setAssistantToolName] = useState<string | null>(
    null
  )
  const autoGenerateRequestedRef = useRef(false)
  const generationIdRef = useRef(0)

  const resolveAssistantErrorMessage = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof Error && isZipOrAssistantI18nKey(err.message)) {
        return t(err.message)
      }
      return formatApiError(err, t(fallbackKey))
    },
    [t]
  )

  const handleBeforeEnableHelperAgent = useCallback(() => {
    setAssistantError(null)
    autoGenerateRequestedRef.current = true
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

  const buildPromptFromFunctionZip = useCallback(async () => {
    const sourceFiles = await loadLatestFunctionZipSourceFiles(
      appState,
      context.functionId,
      MCP_TOOL_INPUT_SCHEMA_ZIP_I18N_KEYS
    )

    return buildMcpToolInputSchemaPrompt(
      {
        toolName: context.toolName,
        toolDescription: context.toolDescription,
        functionId: context.functionId.trim(),
        httpMethod: context.httpMethod,
        argsLocation: context.argsLocation,
      },
      sourceFiles
    )
  }, [appState, context])

  const handleAssistantGenerate = useCallback(async () => {
    if (!context.functionId.trim() || assistantWorking) {
      return
    }

    autoGenerateRequestedRef.current = false
    const generationId = generationIdRef.current + 1
    generationIdRef.current = generationId

    setAssistantWorking(true)
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)

    const isStale = () => generationIdRef.current !== generationId

    try {
      const prompt = await buildPromptFromFunctionZip()
      if (isStale()) {
        return
      }

      const reply = await chatWithAgent(
        appState,
        JSON_SCHEMA_ASSISTANT_AGENT_ID,
        prompt,
        {
          emptyResponseKey: JSON_SCHEMA_ASSISTANT_I18N_KEYS.emptyResponse,
          onToken: (token) => {
            if (!isStale()) {
              setAssistantStreamText(token)
            }
          },
          onToolActivity: (toolName) => {
            if (!isStale()) {
              setAssistantToolName(toolName)
            }
          },
        }
      )
      if (isStale()) {
        return
      }

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
      showSuccess(t('mcp_tool_input_schema_generate_applied'))
      onClose()
    } catch (err) {
      if (isStale()) {
        return
      }
      if (err instanceof Error && isZipOrAssistantI18nKey(err.message)) {
        setAssistantError(t(err.message))
      } else {
        showError(
          resolveAssistantErrorMessage(err, 'json_schema_assistant_chat_failed')
        )
      }
    } finally {
      if (!isStale()) {
        setAssistantWorking(false)
        setAssistantToolName(null)
      }
    }
  }, [
    appState,
    assistantWorking,
    buildPromptFromFunctionZip,
    context.functionId,
    onApplyGeneratedSchema,
    onClose,
    resolveAssistantErrorMessage,
    showError,
    showSuccess,
    t,
  ])

  useEffect(() => {
    if (!visible) {
      return
    }
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)
    autoGenerateRequestedRef.current = false
  }, [visible, context.functionId])

  useEffect(() => {
    if (
      !visible ||
      helperAgentPresent !== true ||
      !autoGenerateRequestedRef.current ||
      assistantWorking
    ) {
      return
    }

    autoGenerateRequestedRef.current = false
    void handleAssistantGenerate()
  }, [assistantWorking, handleAssistantGenerate, helperAgentPresent, visible])

  const resetAssistantState = useCallback(() => {
    generationIdRef.current += 1
    setAssistantError(null)
    setAssistantStreamText('')
    setAssistantToolName(null)
    setAssistantWorking(false)
    autoGenerateRequestedRef.current = false
  }, [])

  const requestGenerate = useCallback(() => {
    autoGenerateRequestedRef.current = true
    void handleAssistantGenerate()
  }, [handleAssistantGenerate])

  return {
    assistantError,
    helperAgentPresent,
    provisioningAgent,
    assistantWorking,
    assistantStreamText,
    assistantToolName,
    handleEnableHelperAgent,
    handleAssistantGenerate: requestGenerate,
    resetAssistantState,
  }
}
