import { describe, expect, it } from 'vitest'
import {
  McpToolInvocationArgsLocation,
  McpToolInvocationMethod,
} from '../types/Mcp'
import {
  applyMcpToolDraftToTool,
  extractMcpToolDraftFromAgentMessage,
} from './mcpToolFromFunctionAssistantHelpers'
import { buildMcpToolFromFunctionPrompt } from './mcpToolFromFunctionPrompt.helpers'

describe('mcpToolFromFunctionAssistantHelpers', () => {
  it('extracts draft JSON from fenced agent message', () => {
    const draft = extractMcpToolDraftFromAgentMessage(`
Here is the tool:
\`\`\`json
{
  "toolName": "get_product",
  "description": "Fetch product",
  "prompt": "get products by id",
  "method": "GET",
  "argsLocation": "query",
  "inputSchema": { "type": "object", "properties": { "id": { "type": "string" } } },
  "requiredScopes": ["product.product_read"]
}
\`\`\`
`)
    expect(draft?.toolName).toBe('get_product')
    expect(draft?.method).toBe('GET')
  })

  it('applies valid draft fields and keeps functionId', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        prompt: '',
        config: {
          invocation: {
            functionId: 'fn-123',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      {
        toolName: 'get_product',
        description: 'Fetch product',
        prompt: 'get products by id',
        method: 'GET',
        argsLocation: 'query',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
        requiredScopes: ['product.product_read'],
      },
      { availableScopeIds: ['product.product_read'] }
    )

    expect(result.appliedFieldCount).toBe(7)
    expect(result.tool.name).toBe('get_product')
    expect(result.tool.config?.requiredScopes).toEqual(['product.product_read'])
    expect(result.tool.config?.invocation?.functionId).toBe('fn-123')
    expect(result.tool.config?.invocation?.method).toBe('GET')
    expect(result.tool.config?.invocation?.argsLocation).toBe(
      McpToolInvocationArgsLocation.QUERY
    )
  })

  it('keeps catalog scopes and drops unknown requiredScopes', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          requiredScopes: ['old.scope'],
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      {
        requiredScopes: [
          'product.product_read',
          'made_up.scope',
          'product.product_read',
        ],
      },
      { availableScopeIds: ['product.product_read', 'order.order_read'] }
    )

    expect(result.appliedFieldCount).toBe(1)
    expect(result.tool.config?.requiredScopes).toEqual(['product.product_read'])
  })

  it('applies empty requiredScopes when none match the catalog', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          requiredScopes: ['old.scope'],
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      { requiredScopes: ['made_up.scope'] },
      { availableScopeIds: ['product.product_read'] }
    )

    expect(result.appliedFieldCount).toBe(1)
    expect(result.tool.config?.requiredScopes).toEqual([])
  })

  it('keeps generated requiredScopes when catalog is empty', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      { requiredScopes: ['product.product_read', 'made_up.scope'] },
      { availableScopeIds: [] }
    )

    expect(result.appliedFieldCount).toBe(1)
    expect(result.tool.config?.requiredScopes).toEqual([
      'product.product_read',
      'made_up.scope',
    ])
  })

  it('skips requiredScopes when catalog is undefined (still loading)', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          requiredScopes: ['product.product_read'],
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      { requiredScopes: ['made_up.scope'] },
      { availableScopeIds: undefined }
    )

    expect(result.appliedFieldCount).toBe(0)
    expect(result.tool.config?.requiredScopes).toEqual(['product.product_read'])
  })

  it('leaves existing requiredScopes when draft omits them', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          requiredScopes: ['product.product_read'],
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      { prompt: 'keep scopes' }
    )

    expect(result.appliedFieldCount).toBe(1)
    expect(result.tool.config?.requiredScopes).toEqual(['product.product_read'])
  })

  it('skips invalid toolName and counts only valid fields', () => {
    const result = applyMcpToolDraftToTool(
      {
        name: '',
        config: {
          invocation: {
            functionId: 'fn-1',
            method: McpToolInvocationMethod.POST,
          },
        },
      },
      {
        toolName: 'invalid name',
        prompt: 'valid prompt',
      }
    )

    expect(result.appliedFieldCount).toBe(1)
    expect(result.tool.name).toBe('')
    expect(result.tool.prompt).toBe('valid prompt')
  })
})

describe('mcpToolFromFunctionPrompt.helpers', () => {
  it('builds prompt with function context and source blocks', () => {
    const prompt = buildMcpToolFromFunctionPrompt(
      {
        functionId: 'fn-123',
        functionName: 'products',
        runtime: 'nodejs20',
      },
      [{ path: 'index.js', content: 'exports.handler = () => {}' }]
    )

    expect(prompt).toContain('Cloud function ID: fn-123')
    expect(prompt).toContain('toolName')
    expect(prompt).toContain('// index.js')
  })
})
