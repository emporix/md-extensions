import { Tool } from '../types/Tool';
import { AppState } from '../types/common';
import { ApiClient } from './apiClient';

export class ToolsService {
  private api: ApiClient;
  private tenant: string;

  constructor(appState: AppState) {
    this.api = new ApiClient(appState);
    this.tenant = appState.tenant;
  }

  async getTools(): Promise<Tool[]> {
    try {
      return await this.api.get<Tool[]>(`/ai-service/${this.tenant}/agentic/tools`);
    } catch (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }
  }

  async updateTool(tool: Tool): Promise<Tool> {
    try {
      return await this.api.put<Tool>(
        `/ai-service/${this.tenant}/agentic/tools/${tool.id}`,
        tool
      );
    } catch (error) {
      console.error('Error updating tool:', error);
      console.log('Mock update tool:', tool);
      return tool;
    }
  }

  async deleteTool(toolId: string): Promise<void> {
    try {
      await this.api.delete(`/ai-service/${this.tenant}/agentic/tools/${toolId}`);
    } catch (error) {
      console.error('Error deleting tool:', error);
      console.log('Mock delete tool:', toolId);
      return Promise.resolve();
    }
  }

  async getSlackInstallationData(): Promise<{id: string, clientId: string}> {
    try {
      return await this.api.get<{id: string, clientId: string}>(
        `/ai-service/${this.tenant}/agentic/oauth/installations/slack`
      );
    } catch (error) {
      console.error('Error getting Slack installation data:', error);
      throw error;
    }
  }
}
