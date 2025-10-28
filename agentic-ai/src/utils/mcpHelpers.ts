import { McpServer } from '../types/Mcp';

export const createEmptyMcpServer = (): McpServer => ({
  id: '',
  name: '',
  transport: 'sse',
  config: {
    url: ''
  },
  enabled: true
});
