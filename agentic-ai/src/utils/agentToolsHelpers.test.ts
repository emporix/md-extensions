import { describe, it, expect } from 'vitest'
import {
  formatDomainSectionTitle,
  getDomainSectionTags,
  getNativeToolSectionTags,
  getPredefinedMcpForDomain,
  getSelectedDomainTools,
  isCustomMcpAttached,
  toggleCustomMcpServer,
  toggleDomainTool,
  toggleNativeTool,
} from './agentToolsHelpers'
import { McpServer, NativeTool } from '../types/Agent'

const orderMcp: McpServer = {
  type: 'predefined',
  domain: 'order',
  tools: ['get-order', 'get-orders'],
}

const customMcp: McpServer = {
  type: 'custom',
  mcpServer: { id: 'custom-1' },
}

describe('agentToolsHelpers', () => {
  it('getPredefinedMcpForDomain returns matching predefined server', () => {
    expect(getPredefinedMcpForDomain([orderMcp, customMcp], 'order')).toEqual(
      orderMcp
    )
    expect(getPredefinedMcpForDomain([customMcp], 'order')).toBeUndefined()
  })

  it('getSelectedDomainTools returns tools or empty array', () => {
    expect(getSelectedDomainTools([orderMcp], 'order')).toEqual([
      'get-order',
      'get-orders',
    ])
    expect(getSelectedDomainTools([], 'order')).toEqual([])
  })

  it('toggleDomainTool adds tool to new domain entry', () => {
    const result = toggleDomainTool([], 'customer', 'get-customer', true)
    expect(result).toEqual([
      {
        type: 'predefined',
        domain: 'customer',
        tools: ['get-customer'],
      },
    ])
  })

  it('toggleDomainTool adds tool to existing domain entry', () => {
    const result = toggleDomainTool([orderMcp], 'order', 'create-return', true)
    expect(result).toEqual([
      {
        type: 'predefined',
        domain: 'order',
        tools: ['create-return', 'get-order', 'get-orders'],
      },
    ])
  })

  it('toggleDomainTool removes tool and deletes entry when empty', () => {
    const singleToolMcp: McpServer = {
      type: 'predefined',
      domain: 'order',
      tools: ['get-order'],
    }
    const result = toggleDomainTool(
      [singleToolMcp],
      'order',
      'get-order',
      false
    )
    expect(result).toEqual([])
  })

  it('toggleDomainTool does not mutate original mcpServers', () => {
    const original: McpServer[] = [orderMcp]
    const originalCopy = structuredClone(original)
    toggleDomainTool(original, 'order', 'create-return', true)
    expect(original).toEqual(originalCopy)
  })

  it('toggleNativeTool adds and removes native tools', () => {
    const initial: NativeTool[] = [{ id: 'tool-a' }]
    const added = toggleNativeTool(initial, 'tool-b', true)
    expect(added).toEqual([{ id: 'tool-a' }, { id: 'tool-b' }])

    const removed = toggleNativeTool(added, 'tool-a', false)
    expect(removed).toEqual([{ id: 'tool-b' }])
  })

  it('toggleNativeTool does not mutate original nativeTools', () => {
    const original: NativeTool[] = [{ id: 'tool-a' }]
    const originalCopy = structuredClone(original)
    toggleNativeTool(original, 'tool-b', true)
    expect(original).toEqual(originalCopy)
  })

  it('toggleCustomMcpServer attaches and detaches custom servers', () => {
    expect(isCustomMcpAttached([], 'custom-1')).toBe(false)

    const attached = toggleCustomMcpServer([], 'custom-1', true)
    expect(isCustomMcpAttached(attached, 'custom-1')).toBe(true)
    expect(attached).toEqual([
      {
        type: 'custom',
        mcpServer: { id: 'custom-1' },
      },
    ])

    const detached = toggleCustomMcpServer(attached, 'custom-1', false)
    expect(detached).toEqual([])
  })

  it('formatDomainSectionTitle uses domain name', () => {
    expect(formatDomainSectionTitle('order')).toBe('Order Domain Tools')
  })

  it('getDomainSectionTags returns configured tags', () => {
    expect(getDomainSectionTags('order')).toEqual([
      'Order',
      'Return',
      'Invoice',
    ])
    expect(getDomainSectionTags('product')).toEqual([
      'Product',
      'Catalog',
      'Brand',
      'Label',
      'Category',
      'Price',
      'Availability',
    ])
    expect(getDomainSectionTags('customer')).toEqual([
      'Customer',
      'Legal Entity',
      'Location',
      'Email',
    ])
  })

  it('getNativeToolSectionTags maps tool types', () => {
    const tags = getNativeToolSectionTags([
      { id: '1', name: 'Slack', type: 'slack', config: {} },
      { id: '2', name: 'RAG', type: 'rag_emporix', config: {} },
    ])
    expect(tags).toEqual(['RAG Tools', 'Slack'])
  })
})
