import { Tool } from '../types/Tool'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export class ToolsService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  async getTools(): Promise<Tool[]> {
    try {
      return await this.api.get<Tool[]>(
        `/ai-service/${this.tenant}/agentic/tools`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch tools'
      throw new Error(errorMessage)
    }
  }

  async updateTool(tool: Tool): Promise<Tool> {
    try {
      return await this.api.put<Tool>(
        `/ai-service/${this.tenant}/agentic/tools/${tool.id}`,
        tool
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update tool'
      throw new Error(errorMessage)
    }
  }

  async patchTool(toolId: string, patches: Array<{op: string, path: string, value: any}>, force?: boolean): Promise<Tool> {
    try {
      const url = `/ai-service/${this.tenant}/agentic/tools/${toolId}${force ? '?force=true' : ''}`;
      return await this.api.patch<Tool>(url, patches);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to patch tool'
      throw new Error(errorMessage)
    }
  }

  async deleteTool(toolId: string, force?: boolean): Promise<void> {
    try {
      await this.api.delete(
        `/ai-service/${this.tenant}/agentic/tools/${toolId}`
      )
      const url = `/ai-service/${this.tenant}/agentic/tools/${toolId}${force ? '?force=true' : ''}`;
      await this.api.delete(url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete tool'
      throw new Error(errorMessage)
    }
  }

  async getSlackInstallationData(): Promise<{ id: string; clientId: string }> {
    try {
      return await this.api.get<{ id: string; clientId: string }>(
        `/ai-service/${this.tenant}/agentic/oauth/installations/slack`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch Slack installation data'
      throw new Error(errorMessage)
    }
  }

  async getTokens(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await this.api.get<Array<{ id: string; name: string }>>(
        `/ai-service/${this.tenant}/agentic/tokens`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch tokens'
      throw new Error(errorMessage)
    }
  }
}
