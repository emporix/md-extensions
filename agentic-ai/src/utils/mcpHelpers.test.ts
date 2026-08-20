import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import {
  CustomMcpServerTransportType,
  McpToolInvocationMethod,
} from '../types/Mcp'
import {
  buildMcpServerUpsertPayload,
  createEmptyDynamicMcpServer,
  createEmptyMcpDraft,
  createEmptyMcpServer,
  createEmptyMcpTool,
  getEnabledDynamicToolNames,
  getMcpTransportLabel,
  getMcpTransportOptions,
  switchMcpServerType,
} from './mcpHelpers'

const mockT = ((key: string) => key) as unknown as TFunction

describe('createEmptyMcpDraft', () => {
  it('returns an untyped MCP draft without connection config', () => {
    const draft = createEmptyMcpDraft()

    expect(draft).toEqual({
      id: '',
      name: '',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      enabled: true,
    })
    expect(draft.type).toBeUndefined()
    expect(draft.config).toBeUndefined()
  })
})

describe('createEmptyMcpServer', () => {
  it('returns a valid empty custom MCP server', () => {
    const server = createEmptyMcpServer()

    expect(server).toEqual({
      id: '',
      name: '',
      type: 'custom',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      config: {
        url: '',
      },
      enabled: true,
    })
  })
})

describe('createEmptyDynamicMcpServer', () => {
  it('returns a dynamic server with one empty tool', () => {
    const server = createEmptyDynamicMcpServer()

    expect(server.type).toBe('dynamic')
    expect(server.config).toBeUndefined()
    expect(server.tools).toHaveLength(1)
    expect(server.transport).toBe(CustomMcpServerTransportType.STREAMABLE_HTTP)
  })
})

describe('buildMcpServerUpsertPayload', () => {
  it('builds custom MCP payload without tools', () => {
    const payload = buildMcpServerUpsertPayload({
      id: 'mcp-custom',
      name: 'Custom MCP',
      type: 'custom',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      enabled: true,
      config: {
        url: 'https://example.com/mcp',
        authorizationHeaderName: 'Authorization',
        authorizationHeaderToken: { id: 'token-1' },
      },
    })

    expect(payload).toEqual({
      name: 'Custom MCP',
      enabled: true,
      type: 'custom',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      config: {
        url: 'https://example.com/mcp',
        authorizationHeaderName: 'Authorization',
        authorizationHeaderToken: { id: 'token-1' },
      },
    })
  })

  it('builds dynamic MCP payload without config', () => {
    const tool = createEmptyMcpTool()
    tool.name = 'create-return'
    tool.prompt = 'Create a return'
    tool.config!.inputSchema = '{"type":"object"}'
    tool.config!.invocation = {
      functionId: 'fn-create-return',
      method: McpToolInvocationMethod.POST,
      argsLocation: 'body',
    }

    const payload = buildMcpServerUpsertPayload({
      id: 'mcp-dynamic',
      name: 'Dynamic MCP',
      type: 'dynamic',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      enabled: true,
      tools: [tool],
    })

    expect(payload).toEqual({
      name: 'Dynamic MCP',
      enabled: true,
      type: 'dynamic',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      tools: [
        {
          name: 'create-return',
          prompt: 'Create a return',
          enabled: true,
          config: {
            inputSchema: '{"type":"object"}',
            invocation: {
              functionId: 'fn-create-return',
              method: McpToolInvocationMethod.POST,
              argsLocation: 'body',
            },
          },
        },
      ],
    })
    expect(payload).not.toHaveProperty('config')
  })

  it('defaults omitted tool enabled to true', () => {
    const tool = createEmptyMcpTool()
    tool.name = 'create-return'
    tool.prompt = 'Create a return'
    delete tool.enabled
    tool.config!.inputSchema = '{"type":"object"}'
    tool.config!.invocation = {
      functionId: 'fn-create-return',
      method: McpToolInvocationMethod.POST,
    }

    const payload = buildMcpServerUpsertPayload({
      id: 'mcp-dynamic',
      name: 'Dynamic MCP',
      type: 'dynamic',
      transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
      enabled: true,
      tools: [tool],
    })

    expect((payload.tools as Array<{ enabled: boolean }>)[0].enabled).toBe(true)
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

describe('switchMcpServerType', () => {
  it('preserves id and name when switching type during create', () => {
    const switched = switchMcpServerType('dynamic', {
      id: 'my-mcp',
      name: 'My MCP',
      enabled: true,
    })

    expect(switched.type).toBe('dynamic')
    expect(switched.id).toBe('my-mcp')
    expect(switched.name).toBe('My MCP')
    expect(switched.tools).toHaveLength(1)
    expect(switched.config).toBeUndefined()
  })

  it('resets to custom defaults when switching back from dynamic', () => {
    const switched = switchMcpServerType('custom', {
      id: 'my-mcp',
      name: 'My MCP',
      enabled: false,
    })

    expect(switched.type).toBe('custom')
    expect(switched.id).toBe('my-mcp')
    expect(switched.name).toBe('My MCP')
    expect(switched.enabled).toBe(false)
    expect(switched.config).toEqual({ url: '' })
    expect(switched.tools).toBeUndefined()
  })
})

describe('getEnabledDynamicToolNames', () => {
  it('returns enabled tool names and skips disabled or empty names', () => {
    expect(
      getEnabledDynamicToolNames([
        { name: 'alpha', enabled: true },
        { name: 'beta', enabled: false },
        { name: '', enabled: true },
        { name: 'gamma' },
      ])
    ).toEqual(['alpha', 'gamma'])
  })

  it('returns empty array when tools undefined', () => {
    expect(getEnabledDynamicToolNames(undefined)).toEqual([])
  })
})
