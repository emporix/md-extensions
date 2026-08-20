import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import {
  CustomMcpServerTransportType,
  McpToolInvocationMethod,
} from '../types/Mcp'
import { ValidationError } from './validation'
import { validateDynamicMcpServer, validateMcpServer } from './mcpValidationHelpers'

const mockT = ((key: string, options?: Record<string, unknown>) => {
  if (options) {
    return `${key}:${JSON.stringify(options)}`
  }
  return key
}) as unknown as TFunction

describe('validateDynamicMcpServer', () => {
  it('accepts a valid dynamic MCP server', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: true,
          tools: [
            {
              name: 'create-return',
              prompt: 'Create return',
              enabled: true,
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: 'fn-create-return',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).not.toThrow()
  })

  it('accepts disabled tool with invalid config', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: true,
          tools: [
            {
              name: 'create-return',
              prompt: 'Create return',
              enabled: true,
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: 'fn-create-return',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
            {
              name: 'broken-tool',
              prompt: '',
              enabled: false,
              config: {
                inputSchema: '',
                invocation: {
                  functionId: '',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).not.toThrow()
  })

  it('rejects enabled tool with missing function id', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: true,
          tools: [
            {
              name: 'broken-tool',
              prompt: 'Broken',
              enabled: true,
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: '',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).toThrow(ValidationError)
  })

  it('rejects enabled dynamic mcp server with only disabled tools', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: true,
          tools: [
            {
              name: 'disabled-tool',
              prompt: '',
              enabled: false,
              config: {
                inputSchema: '',
                invocation: {
                  functionId: '',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).toThrow(ValidationError)
  })

  it('accepts disabled dynamic mcp server with only disabled tools', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: false,
          tools: [
            {
              name: '',
              prompt: '',
              enabled: false,
              config: {
                inputSchema: '',
                invocation: {
                  functionId: '',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).not.toThrow()
  })

  it('accepts multiple disabled tools with empty names when one tool stays enabled', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          enabled: true,
          tools: [
            {
              name: 'create-return',
              prompt: 'Create return',
              enabled: true,
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: 'fn-create-return',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
            {
              name: '',
              prompt: '',
              enabled: false,
              config: {
                inputSchema: '',
                invocation: {
                  functionId: '',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).not.toThrow()
  })

  it('rejects duplicate tool names', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: CustomMcpServerTransportType.STREAMABLE_HTTP,
          tools: [
            {
              name: 'create-return',
              prompt: 'One',
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: 'fn-1',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
            {
              name: 'Create-Return',
              prompt: 'Two',
              config: {
                inputSchema: '{"type":"object"}',
                invocation: {
                  functionId: 'fn-2',
                  method: McpToolInvocationMethod.POST,
                },
              },
            },
          ],
        },
        mockT
      )
    ).toThrow(ValidationError)
  })
})

describe('validateMcpServer', () => {
  it('validates custom MCP servers with URL', () => {
    expect(() =>
      validateMcpServer(
        {
          id: 'mcp-custom',
          name: 'Custom MCP',
          type: 'custom',
          transport: CustomMcpServerTransportType.SSE,
          config: { url: 'https://example.com/mcp' },
        },
        mockT
      )
    ).not.toThrow()
  })
})
