import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { CustomMcpServerTransportType } from '../types/Mcp'
import {
  createEmptyMcpServer,
  getMcpTransportLabel,
  getMcpTransportOptions,
} from './mcpHelpers'

const mockT = ((key: string) => key) as unknown as TFunction

describe('createEmptyMcpServer', () => {
  it('returns a valid empty MCP server', () => {
    const server = createEmptyMcpServer()

    expect(server).toEqual({
      id: '',
      name: '',
      transport: CustomMcpServerTransportType.SSE,
      config: {
        url: '',
      },
      enabled: true,
    })
  })
})

describe('getMcpTransportLabel', () => {
  it('returns translated labels for known transport types', () => {
    expect(getMcpTransportLabel(mockT, CustomMcpServerTransportType.SSE)).toBe(
      'mcp_transport_sse'
    )
    expect(
      getMcpTransportLabel(mockT, CustomMcpServerTransportType.STREAMABLE_HTTP)
    ).toBe('mcp_transport_streamable_http')
  })

  it('returns uppercase fallback for unknown transport types', () => {
    expect(getMcpTransportLabel(mockT, 'custom')).toBe('CUSTOM')
  })
})

describe('getMcpTransportOptions', () => {
  it('returns both transport options with translated labels', () => {
    expect(getMcpTransportOptions(mockT)).toEqual([
      {
        label: 'mcp_transport_sse',
        value: CustomMcpServerTransportType.SSE,
      },
      {
        label: 'mcp_transport_streamable_http',
        value: CustomMcpServerTransportType.STREAMABLE_HTTP,
      },
    ])
  })
})
