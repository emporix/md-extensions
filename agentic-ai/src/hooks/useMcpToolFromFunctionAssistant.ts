import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import { McpTool } from '../types/Mcp'
import { useAppState } from '../contexts/AppStateContext'
import {
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_AGENT_ID,
  chatWithAgent,
  createMcpToolFromFunctionAssistantAgent,
} from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'
import {
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS,
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_MESSAGES,
  applyMcpToolDraftToTool,
  extractMcpToolDraftFromAgentMessage,
} from '../utils/mcpToolFromFunctionAssistantHelpers'
import { buildMcpToolFromFunctionPrompt } from '../utils/mcpToolFromFunctionPrompt.helpers'
import {
  MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS,
  isFunctionZipI18nErrorKey,
  loadLatestFunctionZipSourceFiles,
} from '../utils/loadLatestFunctionZipSource.helpers'
import { useHelperAgentProvisioning } from './useHelperAgentProvisioning'

const isAssistantServiceI18nMessage = (message: string): boolean =>
  MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_MESSAGES.includes(message)

const MCP_TOOL_FROM_FUNCTION_HELPER_I18N_KEYS = {
  agentCreated: 'mcp_tool_from_function_assistant_agent_created',
  agentExists: 'mcp_tool_from_function_assistant_agent_exists',
  createFailed: 'mcp_tool_from_function_assistant_create_failed',
  enableFailed: 'mcp_tool_from_function_assistant_enable_failed',
} as const

export type McpToolFromFunctionAssistantContext = {
  functionId: string
  functionName?: string
  runtime?: string
}

export interface UseMcpToolFromFunctionAssistantParams {
  visible: boolean
  tool: McpTool
  context: McpToolFromFunctionAssistantContext
  availableScopeIds?: readonly string[] | undefined
  onApplyGeneratedTool: (tool: McpTool) => void
  onClose: () => void
}

const isZipOrAssistantI18nKey = (message: string): boolean =>
  isAssistantServiceI18nMessage(message) ||
  isFunctionZipI18nErrorKey(message, MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS)

export const useMcpToolFromFunctionAssistant = ({
  visible,
  tool,
  context,
  availableScopeIds,
  onApplyGeneratedTool,
  onClose,
}: UseMcpToolFromFunctionAssistantParams) => {
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
      agentId: MCP_TOOL_FROM_FUNCTION_ASSISTANT_AGENT_ID,
      shouldCheck: visible,
      createAgent: createMcpToolFromFunctionAssistantAgent,
      i18nKeys: MCP_TOOL_FROM_FUNCTION_HELPER_I18N_KEYS,
      resolveErrorMessage: resolveAssistantErrorMessage,
      onBeforeEnable: handleBeforeEnableHelperAgent,
    })

  const buildPromptFromFunctionZip = useCallback(async () => {
    const sourceFiles = await loadLatestFunctionZipSourceFiles(
      appState,
      context.functionId,
      MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS
    )

    return buildMcpToolFromFunctionPrompt(
      {
        functionId: context.functionId.trim(),
        functionName: context.functionName,
        runtime: context.runtime,
      },
      sourceFiles
    )
  }, [appState, context.functionId, context.functionName, context.runtime])

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
        MCP_TOOL_FROM_FUNCTION_ASSISTANT_AGENT_ID,
        prompt,
        {
          emptyResponseKey:
            MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS.emptyResponse,
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

      const draft = extractMcpToolDraftFromAgentMessage(reply)
      if (!draft) {
        setAssistantError(
          t(MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS.extractFailed)
        )
        return
      }

      const { tool: nextTool, appliedFieldCount } = applyMcpToolDraftToTool(
        tool,
        draft,
        { availableScopeIds }
      )
      if (appliedFieldCount === 0) {
        setAssistantError(
          t(MCP_TOOL_FROM_FUNCTION_ASSISTANT_I18N_KEYS.applyFailed)
        )
        return
      }

      onApplyGeneratedTool(nextTool)
      showSuccess(t('mcp_tool_from_function_applied'))
      onClose()
    } catch (err) {
      if (isStale()) {
        return
      }
      if (err instanceof Error && isZipOrAssistantI18nKey(err.message)) {
        setAssistantError(t(err.message))
      } else {
        showError(
          resolveAssistantErrorMessage(
            err,
            'mcp_tool_from_function_assistant_chat_failed'
          )
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
    availableScopeIds,
    buildPromptFromFunctionZip,
    context.functionId,
    onApplyGeneratedTool,
    onClose,
    resolveAssistantErrorMessage,
    showError,
    showSuccess,
    t,
    tool,
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
