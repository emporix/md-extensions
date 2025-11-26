import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { McpServer } from '../types/Mcp'
import { AppState } from '../types/common'
import { formatApiError } from '../utils/errorHelpers'
import {
  deleteMcpServer,
  getMcpServers,
  upsertMcpServer as upsertMcpServerApi,
  patchMcpServer,
} from '../services/mcpService'
import { useDeleteConfirmation } from './useDeleteConfirmation'
import { useUpsertItem } from './useUpsertItem'
import { useToast } from '../contexts/ToastContext'
import { ApiClientError } from '../services/apiClient'

export const useMcp = (appState: AppState) => {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()

  const [forceToggleConfirmVisible, setForceToggleConfirmVisible] =
    useState(false)
  const [pendingToggle, setPendingToggle] = useState<{
    mcpServerId: string
    enabled: boolean
  } | null>(null)

  const {
    deleteConfirmVisible,
    itemToDelete: mcpServerToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
  } = useDeleteConfirmation({
    onDelete: async (mcpServerId: string, force?: boolean) => {
      await deleteMcpServer(appState, mcpServerId, force)
    },
    onSuccess: (mcpServerId: string) => {
      setMcpServers((prev) =>
        prev.filter((server) => server.id !== mcpServerId)
      )
    },
    successMessage: t(
      'mcp_server_deleted_successfully',
      'MCP Server deleted successfully!'
    ),
    errorMessage: 'Failed to delete MCP server',
  })

  const loadMcpServers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedMcpServers = await getMcpServers(appState)
      setMcpServers(fetchedMcpServers)
    } catch (err) {
      const message = formatApiError(err, 'Failed to load MCP servers')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appState])

  const upsertMcpServer = useUpsertItem({
    onUpsert: (server: McpServer) => upsertMcpServerApi(appState, server),
    updateItems: setMcpServers,
    setError: undefined,
    getId: (server: McpServer) => server.id,
  })

  const toggleMcpServerActive = useCallback(
    async (mcpServerId: string, enabled: boolean) => {
      try {
        const currentMcpServer = mcpServers.find(
          (server) => server.id === mcpServerId
        )
        if (!currentMcpServer) {
          throw new Error('MCP Server not found')
        }

        setMcpServers((prev) =>
          prev.map((server) =>
            server.id === mcpServerId ? { ...server, enabled } : server
          )
        )

        const patches = [
          {
            op: 'REPLACE',
            path: '/enabled',
            value: enabled,
          },
        ]
        await patchMcpServer(appState, mcpServerId, patches, false)

        showSuccess(
          `MCP Server ${enabled ? 'activated' : 'deactivated'} successfully!`
        )

        await loadMcpServers()
      } catch (err) {
        if (!enabled && err instanceof ApiClientError && err.force) {
          setPendingToggle({ mcpServerId, enabled })
          setForceToggleConfirmVisible(true)
          setMcpServers((prev) =>
            prev.map((server) =>
              server.id === mcpServerId
                ? { ...server, enabled: !enabled }
                : server
            )
          )
          return
        }

        const errorMessage = formatApiError(
          err,
          'Failed to update MCP server status'
        )
        showError(`Error updating MCP server: ${errorMessage}`)

        setMcpServers((prev) =>
          prev.map((server) =>
            server.id === mcpServerId
              ? { ...server, enabled: !enabled }
              : server
          )
        )
      }
    },
    [mcpServers, appState, showSuccess, showError, loadMcpServers]
  )

  const confirmForceToggle = useCallback(async () => {
    if (!pendingToggle) return

    const { mcpServerId, enabled } = pendingToggle

    try {
      setMcpServers((prev) =>
        prev.map((server) =>
          server.id === mcpServerId ? { ...server, enabled } : server
        )
      )

      const patches = [
        {
          op: 'REPLACE',
          path: '/enabled',
          value: enabled,
        },
      ]
      await patchMcpServer(appState, mcpServerId, patches, true)

      showSuccess(
        `MCP Server ${enabled ? 'activated' : 'deactivated'} successfully!`
      )
      setForceToggleConfirmVisible(false)
      setPendingToggle(null)

      await loadMcpServers()
    } catch (err) {
      const errorMessage = formatApiError(
        err,
        'Failed to update MCP server status'
      )
      showError(`Error updating MCP server: ${errorMessage}`)

      setMcpServers((prev) =>
        prev.map((server) =>
          server.id === mcpServerId ? { ...server, enabled: !enabled } : server
        )
      )
      setForceToggleConfirmVisible(false)
      setPendingToggle(null)
    }
  }, [pendingToggle, appState, showSuccess, showError, loadMcpServers])

  const hideForceToggleConfirm = useCallback(() => {
    setForceToggleConfirmVisible(false)
    setPendingToggle(null)
  }, [])

  const removeMcpServer = useCallback(
    (mcpServerId: string) => {
      showDeleteConfirm(mcpServerId)
    },
    [showDeleteConfirm]
  )

  const refreshMcpServers = useCallback(() => {
    loadMcpServers()
  }, [loadMcpServers])

  useEffect(() => {
    loadMcpServers()
  }, [loadMcpServers])

  return {
    mcpServers,
    loading,
    error,
    upsertMcpServer,
    refreshMcpServers,
    removeMcpServer,
    toggleMcpServerActive,
    deleteConfirmVisible,
    mcpServerToDelete,
    hideDeleteConfirm,
    confirmDelete,
    forceDeleteConfirmVisible,
    hideForceDeleteConfirm,
    confirmForceDelete,
    forceToggleConfirmVisible,
    hideForceToggleConfirm,
    confirmForceToggle,
  }
}
