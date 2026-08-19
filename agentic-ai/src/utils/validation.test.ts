import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { McpToolInvocationMethod } from '../types/Mcp'
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
          transport: 'streamable_http' as never,
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

  it('rejects duplicate tool names', () => {
    expect(() =>
      validateDynamicMcpServer(
        {
          id: 'mcp-dynamic',
          name: 'Dynamic MCP',
          type: 'dynamic',
          transport: 'streamable_http' as never,
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
          transport: 'sse' as never,
          config: { url: 'https://example.com/mcp' },
        },
        mockT
      )
    ).not.toThrow()
  })
})
