import { describe, it, expect } from 'vitest'
import { isToolFormValid } from './toolConfigHelpers'

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

  it('accepts slack tools with empty allowedOperations for backward compatibility', () => {
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
    ).toBe(true)
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
