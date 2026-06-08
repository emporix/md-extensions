import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomMcpServerTransportType, McpServer } from '../types/Mcp'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import { upsertMcpServer as upsertMcpServerApi } from '../services/mcpService'
import { formatApiError } from '../utils/errorHelpers'
import { sanitizeIdInput, validateMcpServer } from '../utils/validation'

interface UseMcpConfigProps {
  mcpServer: McpServer | null
  isCreating: boolean
  onSave: () => void
}

interface McpConfigState {
  mcpServerId: string
  mcpServerName: string
  url: string
  transport: CustomMcpServerTransportType
  authorizationHeaderName: string
  authorizationHeaderToken: string
}

export type McpConfigField = keyof McpConfigState

export const useMcpConfig = ({
  mcpServer,
  isCreating,
  onSave,
}: UseMcpConfigProps) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const [state, setState] = useState<McpConfigState>({
    mcpServerId: '',
    mcpServerName: '',
    url: '',
    transport: CustomMcpServerTransportType.SSE,
    authorizationHeaderName: '',
    authorizationHeaderToken: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mcpServer) {
      setState({
        mcpServerId: mcpServer.id ?? '',
        mcpServerName: mcpServer.name ?? '',
        url: mcpServer.config.url ?? '',
        transport: mcpServer.transport,
        authorizationHeaderName: mcpServer.config.authorizationHeaderName ?? '',
        authorizationHeaderToken:
          mcpServer.config.authorizationHeaderToken?.id ?? '',
      })
    }
  }, [mcpServer])

  const updateField = useCallback(
    (field: McpConfigField, value: string | CustomMcpServerTransportType) => {
      setState((prev) => ({
        ...prev,
        [field]:
          field === 'mcpServerId' && typeof value === 'string'
            ? sanitizeIdInput(value)
            : value,
      }))
    },
    []
  )

  const isFormValid = useCallback(() => {
    if (!state.mcpServerName.trim() || !state.url.trim()) {
      return false
    }

    if (isCreating && !state.mcpServerId.trim()) {
      return false
    }

    return true
  }, [isCreating, state.mcpServerId, state.mcpServerName, state.url])

  const handleSave = useCallback(async () => {
    if (!mcpServer || !isFormValid()) {
      return
    }

    const updatedMcpServer: McpServer = {
      ...mcpServer,
      id: state.mcpServerId,
      name: state.mcpServerName,
      transport: state.transport,
      enabled: mcpServer.enabled ?? true,
      config: {
        url: state.url,
        authorizationHeaderName: state.authorizationHeaderName.trim()
          ? state.authorizationHeaderName
          : undefined,
        authorizationHeaderToken: state.authorizationHeaderToken
          ? { id: state.authorizationHeaderToken }
          : undefined,
      },
    }

    try {
      validateMcpServer(updatedMcpServer)
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
    state.authorizationHeaderName,
    state.authorizationHeaderToken,
    state.mcpServerId,
    state.mcpServerName,
    state.transport,
    state.url,
    t,
  ])

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid(),
  }
}
