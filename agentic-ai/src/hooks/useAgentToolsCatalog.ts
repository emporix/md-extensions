import { useCallback, useEffect, useState } from 'react'
import { McpServer } from '../types/Mcp'
import { Tool } from '../types/Tool'
import { AppState } from '../types/common'
import { getMcpServers } from '../services/mcpService'
import { getTools } from '../services/toolsService'

export const useAgentToolsCatalog = (appState: AppState) => {
  const [tools, setTools] = useState<Tool[]>([])
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [mcpServersLoading, setMcpServersLoading] = useState(true)

  const fetchCatalog = useCallback(async () => {
    if (!appState.tenant || !appState.token) {
      setTools([])
      setMcpServers([])
      setToolsLoading(false)
      setMcpServersLoading(false)
      return
    }

    setToolsLoading(true)
    setMcpServersLoading(true)

    try {
      const [fetchedTools, fetchedMcpServers] = await Promise.all([
        getTools(appState),
        getMcpServers(appState),
      ])

      setTools(fetchedTools)
      setMcpServers(fetchedMcpServers)
    } catch {
      setTools([])
      setMcpServers([])
    } finally {
      setToolsLoading(false)
      setMcpServersLoading(false)
    }
  }, [appState])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return {
    tools,
    mcpServers,
    toolsLoading,
    mcpServersLoading,
  }
}
