import { CustomMcpServerTransportType, McpServer } from '../types/Mcp'

export const createEmptyMcpServer = (): McpServer => ({
  id: '',
  name: '',
  transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
  config: {
    url: '',
  },
  enabled: true,
})
