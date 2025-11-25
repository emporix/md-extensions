import { AppState } from '../types/common'
import { TokensService } from './tokensService'
import { ToolsService } from './toolsService'
import { McpService } from './mcpService'
import { AgentService } from './agentService'

export class ServiceFactory {
  private static instances = new Map<
    string,
    TokensService | ToolsService | McpService | AgentService
  >()

  static getTokensService(appState: AppState): TokensService {
    const key = `tokens-${appState.tenant}-${appState.token}`
    if (!this.instances.has(key)) {
      this.instances.set(key, new TokensService(appState))
    }
    return this.instances.get(key) as TokensService
  }

  static getToolsService(appState: AppState): ToolsService {
    const key = `tools-${appState.tenant}-${appState.token}`
    if (!this.instances.has(key)) {
      this.instances.set(key, new ToolsService(appState))
    }
    return this.instances.get(key) as ToolsService
  }

  static getMcpService(appState: AppState): McpService {
    const key = `mcp-${appState.tenant}-${appState.token}`
    if (!this.instances.has(key)) {
      this.instances.set(key, new McpService(appState))
    }
    return this.instances.get(key) as McpService
  }

  static getAgentService(appState: AppState): AgentService {
    const key = `agent-${appState.tenant}-${appState.token}`
    if (!this.instances.has(key)) {
      this.instances.set(key, new AgentService(appState))
    }
    return this.instances.get(key) as AgentService
  }

  static clearCache(): void {
    this.instances.clear()
  }
}
