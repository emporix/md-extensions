import { McpServer } from '../types/Mcp';
import { AppState } from '../types/common';
import { ApiClient } from './apiClient';

export class McpService {
  private api: ApiClient;
  private tenant: string;

  constructor(appState: AppState) {
    this.api = new ApiClient(appState);
    this.tenant = appState.tenant;
  }

  async getMcpServers(): Promise<McpServer[]> {
    try {
      return await this.api.get<McpServer[]>(`/ai-service/${this.tenant}/agentic/mcp-servers`);
    } catch (error) {
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
    try {
      return await this.api.put<McpServer>(
        `/ai-service/${this.tenant}/agentic/mcp-servers/${mcpServer.id}`,
        {
          name: mcpServer.name,
          transport: mcpServer.transport,
          config: mcpServer.config
        }
      );
    } catch (error) {
      console.error('Error upserting MCP server:', error);
      throw error;
    }
  }

  async deleteMcpServer(mcpServerId: string): Promise<void> {
    try {
      await this.api.delete(`/ai-service/${this.tenant}/agentic/mcp-servers/${mcpServerId}`);
    } catch (error) {
      return Promise.resolve();
    }
  }
}
