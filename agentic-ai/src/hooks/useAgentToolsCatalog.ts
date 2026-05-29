import { useCallback, useEffect, useState } from 'react'
import { McpServer } from '../types/Mcp'
import { Tool } from '../types/Tool'
import { AppState } from '../types/common'
import { getMcpServers } from '../services/mcpService'
import { getTools } from '../services/toolsService'

type AgentToolsCatalogCacheEntry = {
  tools: Tool[]
  mcpServers: McpServer[]
}

const agentToolsCatalogCache = new Map<string, AgentToolsCatalogCacheEntry>()
const agentToolsCatalogRequests = new Map<
  string,
  Promise<AgentToolsCatalogCacheEntry>
>()

const getAgentToolsCatalogCacheKey = (appState: AppState): string | null => {
  if (!appState.tenant) {
    return null
  }
  return appState.tenant
}

export const useAgentToolsCatalog = (appState: AppState) => {
  const cacheKey = getAgentToolsCatalogCacheKey(appState)
  const cached = cacheKey ? agentToolsCatalogCache.get(cacheKey) : undefined

  const [tools, setTools] = useState<Tool[]>(cached?.tools ?? [])
  const [mcpServers, setMcpServers] = useState<McpServer[]>(
    cached?.mcpServers ?? []
  )
  const [toolsLoading, setToolsLoading] = useState(!cached)
  const [mcpServersLoading, setMcpServersLoading] = useState(!cached)

  const fetchCatalog = useCallback(async () => {
    if (!appState.tenant || !appState.token || !cacheKey) {
      setTools([])
      setMcpServers([])
      setToolsLoading(false)
      setMcpServersLoading(false)
      return
    }

    const cachedEntry = agentToolsCatalogCache.get(cacheKey)
    if (cachedEntry) {
      setTools(cachedEntry.tools)
      setMcpServers(cachedEntry.mcpServers)
      setToolsLoading(false)
      setMcpServersLoading(false)
      return
    }

    setToolsLoading(true)
    setMcpServersLoading(true)

    try {
      let request = agentToolsCatalogRequests.get(cacheKey)
      if (!request) {
        request = Promise.all([getTools(appState), getMcpServers(appState)])
          .then(([fetchedTools, fetchedMcpServers]) => {
            const entry: AgentToolsCatalogCacheEntry = {
              tools: fetchedTools,
              mcpServers: fetchedMcpServers,
            }
            agentToolsCatalogCache.set(cacheKey, entry)
            return entry
          })
          .finally(() => {
            agentToolsCatalogRequests.delete(cacheKey)
          })
        agentToolsCatalogRequests.set(cacheKey, request)
      }

      const entry = await request
      setTools(entry.tools)
      setMcpServers(entry.mcpServers)
    } catch {
      const emptyEntry: AgentToolsCatalogCacheEntry = {
        tools: [],
        mcpServers: [],
      }
      agentToolsCatalogCache.set(cacheKey, emptyEntry)
      setTools([])
      setMcpServers([])
    } finally {
      setToolsLoading(false)
      setMcpServersLoading(false)
    }
  }, [appState, cacheKey])

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
