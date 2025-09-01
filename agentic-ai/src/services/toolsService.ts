import { Tool } from '../types/Tool';
import { AppState } from '../types/common';

export class ToolsService {
  private _baseUrl: string;
  private _appState: AppState;

  constructor(appState: AppState) {
    this._baseUrl = import.meta.env.VITE_API_URL || 'https://api.emporix.io';
    this._appState = appState;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Emporix-tenant': this._appState.tenant,
      'Authorization': `Bearer ${this._appState.token}`,
    };
  }

  async getTools(): Promise<Tool[]> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tools`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }
  }

  async updateTool(tool: Tool): Promise<Tool> {
    // ID is mandatory for all operations
    if (!tool.id || tool.id.trim() === '') {
      throw new Error('Tool ID is required');
    }

    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tools/${tool.id}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(tool),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update tool: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating tool:', error);
      // For development, just return the tool as-is
      console.log('Mock update tool:', tool);
      return tool;
    }
  }

  async deleteTool(toolId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tools/${toolId}`,
        {
          method: 'DELETE',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete tool: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      console.log('Mock delete tool:', toolId);
      return Promise.resolve();
    }
  }
}
