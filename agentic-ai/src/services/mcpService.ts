import { McpServer } from '../types/Mcp'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export class McpService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  async getMcpServers(): Promise<McpServer[]> {
    try {
      return await this.api.get<McpServer[]>(
        `/ai-service/${this.tenant}/agentic/mcp-servers`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load MCP servers'
      throw new Error(errorMessage)
    }
  }

  async upsertMcpServer(mcpServer: McpServer): Promise<McpServer> {
    try {
      const payload = {
        name: mcpServer.name,
        transport: mcpServer.transport,
        config: mcpServer.config,
        enabled: mcpServer.enabled,
      }
      return await this.api.put<McpServer>(
        `/ai-service/${this.tenant}/agentic/mcp-servers/${mcpServer.id}`,
        payload
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save MCP server'
      throw new Error(errorMessage)
    }
  }

  async patchMcpServer(
    mcpServerId: string,
    patches: Array<{ op: string; path: string; value: unknown }>,
    force?: boolean
  ): Promise<McpServer> {
    try {
      const url = `/ai-service/${this.tenant}/agentic/mcp-servers/${mcpServerId}${force ? '?force=true' : ''}`
      return await this.api.patch<McpServer>(url, patches)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to patch MCP server'
      throw new Error(errorMessage)
    }
  }

  async deleteMcpServer(mcpServerId: string, force?: boolean): Promise<void> {
    try {
      const url = `/ai-service/${this.tenant}/agentic/mcp-servers/${mcpServerId}${force ? '?force=true' : ''}`
      await this.api.delete(url)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete MCP server'
      throw new Error(errorMessage)
    }
  }
}
