import { CustomMcpServerTransportType, McpServer } from '../types/Mcp'
import { TFunction } from 'i18next'

export const createEmptyMcpServer = (): McpServer => ({
  id: '',
  name: '',
  transport: CustomMcpServerTransportType.SSE,
  config: {
    url: '',
  },
  enabled: true,
})

export const getMcpTransportLabel = (
  t: TFunction,
  transport: CustomMcpServerTransportType | string
): string => {
  switch (transport) {
    case CustomMcpServerTransportType.SSE:
      return t('mcp_transport_sse')
    case CustomMcpServerTransportType.STREAMABLE_HTTP:
      return t('mcp_transport_streamable_http')
    default:
      return String(transport).toUpperCase()
  }
}

export const getMcpTransportOptions = (t: TFunction) => [
  {
    label: t('mcp_transport_sse'),
    value: CustomMcpServerTransportType.SSE,
  },
  {
    label: t('mcp_transport_streamable_http'),
    value: CustomMcpServerTransportType.STREAMABLE_HTTP,
  },
]
