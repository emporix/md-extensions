import { describe, it, expect } from 'vitest'
import {
  formatDomainSectionTitle,
  getDomainSectionTags,
  getNativeToolSectionTags,
  getNativeToolTags,
  getPredefinedMcpForDomain,
  getSelectedDomainTools,
  getSelectedDynamicMcpTools,
  formatManagedMcpServerLabel,
  hasManagedMcpAttachmentsChanged,
  isManagedMcpAttached,
  normalizeManagedMcpAttachments,
  toggleDomainTool,
  toggleDynamicMcpTool,
  toggleManagedMcpServer,
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

  it('toggleManagedMcpServer attaches and detaches custom servers', () => {
    expect(isManagedMcpAttached([], 'custom-1')).toBe(false)

    const attached = toggleManagedMcpServer([], 'custom-1', true, 'custom')
    expect(isManagedMcpAttached(attached, 'custom-1')).toBe(true)
    expect(attached).toEqual([
      {
        type: 'custom',
        mcpServer: { id: 'custom-1' },
      },
    ])

    const detached = toggleManagedMcpServer(
      attached,
      'custom-1',
      false,
      'custom'
    )
    expect(detached).toEqual([])
  })

  it('toggleManagedMcpServer attaches dynamic servers without tools', () => {
    const attached = toggleManagedMcpServer([], 'dyn-1', true, 'dynamic')
    expect(attached).toEqual([
      {
        type: 'dynamic',
        mcpServer: { id: 'dyn-1' },
      },
    ])
  })

  it('getSelectedDynamicMcpTools returns all enabled tools when tools omitted', () => {
    const attached = toggleManagedMcpServer([], 'dyn-1', true, 'dynamic')
    const catalog = ['alpha', 'beta']
    expect(getSelectedDynamicMcpTools(attached, 'dyn-1', catalog)).toEqual(
      catalog
    )
  })

  it('getSelectedDynamicMcpTools returns all enabled tools for custom-typed attached ref', () => {
    const attached: McpServer[] = [
      { type: 'custom', mcpServer: { id: 'dyn-1' } },
    ]
    const catalog = ['alpha', 'beta']
    expect(getSelectedDynamicMcpTools(attached, 'dyn-1', catalog)).toEqual(
      catalog
    )
  })

  it('getSelectedDynamicMcpTools intersects subset with catalog', () => {
    const attached: McpServer[] = [
      {
        type: 'dynamic',
        mcpServer: { id: 'dyn-1' },
        tools: ['alpha', 'removed-from-catalog'],
      },
    ]
    expect(
      getSelectedDynamicMcpTools(attached, 'dyn-1', ['alpha', 'beta'])
    ).toEqual(['alpha'])
  })

  it('toggleDynamicMcpTool writes subset and omits tools when all selected', () => {
    const catalog = ['alpha', 'beta']
    const attached = toggleManagedMcpServer([], 'dyn-1', true, 'dynamic')
    const subset = toggleDynamicMcpTool(
      attached,
      'dyn-1',
      'alpha',
      false,
      catalog
    )
    expect(subset).toEqual([
      {
        type: 'dynamic',
        mcpServer: { id: 'dyn-1' },
        tools: ['beta'],
      },
    ])

    const allSelected = toggleDynamicMcpTool(
      subset,
      'dyn-1',
      'alpha',
      true,
      catalog
    )
    expect(allSelected).toEqual([
      {
        type: 'dynamic',
        mcpServer: { id: 'dyn-1' },
      },
    ])
  })

  it('toggleDynamicMcpTool on custom-typed ref upgrades to dynamic without wiping selection', () => {
    const catalog = ['alpha', 'beta']
    const attached: McpServer[] = [
      { type: 'custom', mcpServer: { id: 'dyn-1' } },
    ]
    const subset = toggleDynamicMcpTool(
      attached,
      'dyn-1',
      'alpha',
      false,
      catalog
    )
    expect(subset).toEqual([
      {
        type: 'dynamic',
        mcpServer: { id: 'dyn-1' },
        tools: ['beta'],
      },
    ])
  })

  it('toggleDynamicMcpTool keeps attachment when last tool is unchecked', () => {
    const catalog = ['alpha']
    const attached = toggleManagedMcpServer([], 'dyn-1', true, 'dynamic')
    const unchanged = toggleDynamicMcpTool(
      attached,
      'dyn-1',
      'alpha',
      false,
      catalog
    )
    expect(unchanged).toEqual(attached)
  })

  it('normalizeManagedMcpAttachments upgrades custom refs to dynamic', () => {
    const result = normalizeManagedMcpAttachments(
      [{ type: 'custom', mcpServer: { id: 'dyn-1' } }],
      [{ id: 'dyn-1', type: 'dynamic' }]
    )
    expect(result).toEqual([{ type: 'dynamic', mcpServer: { id: 'dyn-1' } }])
  })

  it('normalizeManagedMcpAttachments downgrades dynamic to custom and strips tools', () => {
    const result = normalizeManagedMcpAttachments(
      [
        {
          type: 'dynamic',
          mcpServer: { id: 'custom-1' },
          tools: ['alpha'],
        },
      ],
      [{ id: 'custom-1', type: 'custom' }]
    )
    expect(result).toEqual([{ type: 'custom', mcpServer: { id: 'custom-1' } }])
  })

  it('normalizeManagedMcpAttachments does not mutate original mcpServers', () => {
    const original: McpServer[] = [
      { type: 'custom', mcpServer: { id: 'dyn-1' } },
    ]
    const originalCopy = structuredClone(original)
    normalizeManagedMcpAttachments(original, [{ id: 'dyn-1', type: 'dynamic' }])
    expect(original).toEqual(originalCopy)
  })

  it('hasManagedMcpAttachmentsChanged detects type and tools changes', () => {
    const current: McpServer[] = [
      { type: 'custom', mcpServer: { id: 'dyn-1' } },
    ]
    const next: McpServer[] = [{ type: 'dynamic', mcpServer: { id: 'dyn-1' } }]
    expect(hasManagedMcpAttachmentsChanged(current, next)).toBe(true)
    expect(hasManagedMcpAttachmentsChanged(current, current)).toBe(false)
  })

  it('formatManagedMcpServerLabel appends tool names in brackets for dynamic MCP', () => {
    expect(
      formatManagedMcpServerLabel('Orders MCP', ['alpha', 'beta'], true)
    ).toBe('Orders MCP (alpha, beta)')
    expect(formatManagedMcpServerLabel('Custom MCP', [], true)).toBe(
      'Custom MCP'
    )
    expect(formatManagedMcpServerLabel('Custom MCP', ['alpha'], false)).toBe(
      'Custom MCP'
    )
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

  it('getNativeToolTags maps individual tool types', () => {
    expect(getNativeToolTags({ type: 'slack' })).toEqual(['Slack'])
    expect(getNativeToolTags({ type: 'teams' })).toEqual(['Microsoft Teams'])
    expect(getNativeToolTags({ type: 'rag_custom' })).toEqual(['RAG Tools'])
    expect(getNativeToolTags({ type: 'file' })).toEqual(['File'])
  })
})
