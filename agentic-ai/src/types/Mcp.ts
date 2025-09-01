export interface McpConfig {
  url: string;
  authorizationHeaderName?: string;
  authorizationHeaderTokenId?: string;
}

export interface McpServer {
  id: string;
  name: string;
  transport: string;
  config: McpConfig;
}

export interface McpCardProps {
  mcpServer: McpServer;
  onConfigure: (mcpServer: McpServer) => void;
  onRemove: (mcpServerId: string) => void;
}

export interface McpConfigPanelProps {
  visible: boolean;
  mcpServer: McpServer | null;
  onHide: () => void;
  onSave: (mcpServer: McpServer) => void;
}
