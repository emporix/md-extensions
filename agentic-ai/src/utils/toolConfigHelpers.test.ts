import { describe, it, expect } from 'vitest'
import {
  applySearchToolDefaults,
  isToolFormValid,
  toSearchToolConfig,
} from './toolConfigHelpers'

describe('isToolFormValid teams config', () => {
  it('requires teamId and tenantId for teams tools', () => {
    expect(
      isToolFormValid({
        toolName: 'Teams Support',
        toolId: 'teams-support',
        toolType: 'teams',
        config: {
          teamId: 'team-1',
          tenantId: 'tenant-1',
          defaultInboundAgentId: 'support-agent',
        },
        isCreating: false,
      })
    ).toBe(true)
  })

  it('accepts teams tools without defaultInboundAgentId', () => {
    expect(
      isToolFormValid({
        toolName: 'Teams Support',
        toolId: 'teams-support',
        toolType: 'teams',
        config: {
          teamId: 'team-1',
          tenantId: 'tenant-1',
        },
        isCreating: false,
      })
    ).toBe(true)
  })

  it('rejects teams tools missing tenantId', () => {
    expect(
      isToolFormValid({
        toolName: 'Teams Support',
        toolId: 'teams-support',
        toolType: 'teams',
        config: {
          teamId: 'team-1',
          defaultInboundAgentId: 'support-agent',
        },
        isCreating: false,
      })
    ).toBe(false)
  })

  it('rejects teams tools with empty allowedOperations', () => {
    expect(
      isToolFormValid({
        toolName: 'Teams Support',
        toolId: 'teams-support',
        toolType: 'teams',
        config: {
          teamId: 'team-1',
          tenantId: 'tenant-1',
          defaultInboundAgentId: 'support-agent',
          allowedOperations: [],
        },
        isCreating: false,
      })
    ).toBe(false)
  })
})

describe('isToolFormValid slack config', () => {
  it('requires teamId for slack tools', () => {
    expect(
      isToolFormValid({
        toolName: 'Slack Support',
        toolId: 'slack-support',
        toolType: 'slack',
        config: {
          teamId: 'T123',
          defaultInboundAgentId: 'support-agent',
          allowedOperations: ['sendMessage'],
        },
        isCreating: false,
      })
    ).toBe(true)
  })

  it('accepts slack tools without defaultInboundAgentId', () => {
    expect(
      isToolFormValid({
        toolName: 'Slack Support',
        toolId: 'slack-support',
        toolType: 'slack',
        config: {
          teamId: 'T123',
        },
        isCreating: false,
      })
    ).toBe(true)
  })

  it('rejects slack tools with empty allowedOperations', () => {
    expect(
      isToolFormValid({
        toolName: 'Slack Support',
        toolId: 'slack-support',
        toolType: 'slack',
        config: {
          teamId: 'T123',
          allowedOperations: [],
        },
        isCreating: false,
      })
    ).toBe(false)
  })

  it('accepts search tools for customer and legal-entity', () => {
    expect(
      isToolFormValid({
        toolName: 'Customer Search',
        toolId: 'customer-search',
        toolType: 'search',
        config: {
          entityType: 'customer',
          maxResults: 5,
        },
        isCreating: false,
      })
    ).toBe(true)

    expect(
      isToolFormValid({
        toolName: 'Legal Entity Search',
        toolId: 'legal-entity-search',
        toolType: 'search',
        config: {
          entityType: 'legal-entity',
          maxResults: '10' as unknown as number,
        },
        isCreating: false,
      })
    ).toBe(true)
  })

  it('rejects search tools with an unsupported entity type or max results', () => {
    expect(
      isToolFormValid({
        toolName: 'Product Search',
        toolId: 'product-search',
        toolType: 'search',
        config: {
          entityType: 'product',
          maxResults: 5,
        },
        isCreating: false,
      })
    ).toBe(false)

    expect(
      isToolFormValid({
        toolName: 'Customer Search',
        toolId: 'customer-search',
        toolType: 'search',
        config: {
          entityType: 'customer',
          maxResults: 11,
        },
        isCreating: false,
      })
    ).toBe(false)
  })

  it('serializes search config with a numeric max results and optional prompt', () => {
    expect(
      toSearchToolConfig({
        entityType: 'LEGAL_ENTITY',
        maxResults: '7' as unknown as number,
        prompt: '  prefer active entities  ',
      })
    ).toEqual({
      entityType: 'legal-entity',
      maxResults: 7,
      prompt: 'prefer active entities',
    })

    expect(applySearchToolDefaults({})).toEqual({
      entityType: 'customer',
      maxResults: 5,
    })
  })

  it('requires botToken when creating slack tools', () => {
    expect(
      isToolFormValid({
        toolName: 'Slack Support',
        toolId: 'slack-support',
        toolType: 'slack',
        config: {
          teamId: 'T123',
        },
        isCreating: true,
      })
    ).toBe(false)
  })
})
