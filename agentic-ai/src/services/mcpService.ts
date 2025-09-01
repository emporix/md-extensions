import { McpServer } from '../types/Mcp';
import { AppState } from '../types/common';

export class McpService {
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

  async getMcpServers(): Promise<McpServer[]> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/mcp-servers`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch MCP servers: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      // For development, return mock data
      return [
        {
          id: "mcp-custom",
          name: "Custom MCP Server",
          transport: "sse",
          config: {
            url: "http://localhost:7900",
            authorizationHeaderName: "Authorization",
            authorizationHeaderTokenId: "token-id"
          }
        },
        {
          id: "mcp-filesystem",
          name: "Filesystem MCP Server",
          transport: "stdio",
          config: {
            url: "http://localhost:8000"
          }
        },
        {
          id: "mcp-database",
          name: "Database MCP Server", 
          transport: "sse",
          config: {
            url: "http://localhost:9000",
            authorizationHeaderName: "X-API-Key",
            authorizationHeaderTokenId: "db-token"
          }
        }
      ];
    }
  }

  async upsertMcpServer(mcpServer: McpServer): Promise<McpServer> {
    if (!mcpServer.id || mcpServer.id.trim() === '') {
      throw new Error('MCP Server ID is required');
    }

    if (!mcpServer.name || mcpServer.name.trim() === '') {
      throw new Error('MCP Server name is required');
    }

    if (!mcpServer.config.url || mcpServer.config.url.trim() === '') {
      throw new Error('MCP Server URL is required');
    }

    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/mcp-servers/${mcpServer.id}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            name: mcpServer.name,
            transport: mcpServer.transport,
            config: mcpServer.config
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upsert MCP server: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error upserting MCP server:', error);
      console.log('Mock upsert MCP server:', mcpServer);
      return mcpServer;
    }
  }

  async deleteMcpServer(mcpServerId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/mcp-servers/${mcpServerId}`,
        {
          method: 'DELETE',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete MCP server: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting MCP server:', error);
      console.log('Mock delete MCP server:', mcpServerId);
      return Promise.resolve();
    }
  }
}
