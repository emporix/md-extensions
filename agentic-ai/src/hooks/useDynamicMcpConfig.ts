import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomMcpServerTransportType, McpServer, McpTool } from '../types/Mcp'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import { upsertMcpServer as upsertMcpServerApi } from '../services/mcpService'
import { formatApiError } from '../utils/errorHelpers'
import { createEmptyMcpTool, MCP_TOOL_NAME_PATTERN } from '../utils/mcpHelpers'
import { isValidAgentOutputJsonSchema } from '../utils/validateJsonSchema'
import { sanitizeIdInput } from '../utils/validation'
import { validateMcpServer } from '../utils/mcpValidationHelpers'

interface UseDynamicMcpConfigProps {
  mcpServer: McpServer | null
  isCreating: boolean
  onSave: () => void
}

interface DynamicMcpConfigState {
  mcpServerId: string
  mcpServerName: string
  tools: McpTool[]
}

export type DynamicMcpConfigField = 'mcpServerId' | 'mcpServerName'

export const useDynamicMcpConfig = ({
  mcpServer,
  isCreating,
  onSave,
}: UseDynamicMcpConfigProps) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [state, setState] = useState<DynamicMcpConfigState>({
    mcpServerId: '',
    mcpServerName: '',
    tools: [createEmptyMcpTool()],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mcpServer?.type === 'dynamic') {
      setState({
        mcpServerId: mcpServer.id ?? '',
        mcpServerName: mcpServer.name ?? '',
        tools:
          mcpServer.tools && mcpServer.tools.length > 0
            ? mcpServer.tools.map((tool) => ({
                ...tool,
                enabled: tool.enabled !== false,
                config: {
                  requiredScopes: tool.config?.requiredScopes ?? [],
                  inputSchema:
                    tool.config?.inputSchema ?? '{"type":"object"}',
                  invocation: {
                    functionId: tool.config?.invocation?.functionId ?? '',
                    method: tool.config?.invocation?.method ?? 'POST',
                    argsLocation: tool.config?.invocation?.argsLocation ?? 'body',
                  },
                },
              }))
            : [createEmptyMcpTool()],
      })
    }
  }, [mcpServer])

  const updateField = useCallback(
    (field: DynamicMcpConfigField, value: string) => {
      setState((prev) => ({
        ...prev,
        [field]:
          field === 'mcpServerId' ? sanitizeIdInput(value) : value,
      }))
    },
    []
  )

  const updateTool = useCallback((index: number, tool: McpTool) => {
    setState((prev) => ({
      ...prev,
      tools: prev.tools.map((existing, idx) => (idx === index ? tool : existing)),
    }))
  }, [])

  const addTool = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tools: [...prev.tools, createEmptyMcpTool()],
    }))
  }, [])

  const removeTool = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, idx) => idx !== index),
    }))
  }, [])

  const isToolValid = useCallback((tool: McpTool) => {
    if (tool.enabled === false) {
      return true
    }

    const name = tool.name.trim()
    const inputSchema = tool.config?.inputSchema?.trim() ?? ''

    return (
      !!name &&
      MCP_TOOL_NAME_PATTERN.test(name) &&
      !!tool.prompt?.trim() &&
      !!inputSchema &&
      isValidAgentOutputJsonSchema(inputSchema) &&
      !!tool.config?.invocation?.functionId?.trim() &&
      !!tool.config?.invocation?.method
    )
  }, [])

  const isFormValid = useCallback(() => {
    if (!state.mcpServerName.trim()) {
      return false
    }

    if (isCreating && !state.mcpServerId.trim()) {
      return false
    }

    if (state.tools.length === 0) {
      return false
    }

    const mcpEnabled = mcpServer?.enabled ?? true
    if (mcpEnabled && !state.tools.some((tool) => tool.enabled !== false)) {
      return false
    }

    return state.tools.every(isToolValid)
  }, [isCreating, isToolValid, mcpServer?.enabled, state.mcpServerId, state.mcpServerName, state.tools])

  const handleSave = useCallback(async () => {
    if (!mcpServer || !isFormValid()) {
      return
    }

    const updatedMcpServer: McpServer = {
      ...mcpServer,
      type: 'dynamic',
      id: state.mcpServerId,
      name: state.mcpServerName,
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      enabled: mcpServer.enabled ?? true,
      tools: state.tools,
      config: undefined,
    }

    try {
      validateMcpServer(updatedMcpServer, t)
      setSaving(true)
      await upsertMcpServerApi(appState, updatedMcpServer)
      showSuccess(
        isCreating
          ? t('mcp_server_created_successfully')
          : t('mcp_server_updated_successfully')
      )
      onSave()
    } catch (err) {
      const errorMessage = formatApiError(err, t('error_saving_mcp_server'))
      showError(`${t('error_saving_mcp_server')}: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }, [
    appState,
    isCreating,
    isFormValid,
    mcpServer,
    onSave,
    showError,
    showSuccess,
    state.mcpServerId,
    state.mcpServerName,
    state.tools,
    t,
  ])

  return {
    state,
    saving,
    updateField,
    updateTool,
    addTool,
    removeTool,
    handleSave,
    isFormValid: isFormValid(),
  }
}
