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
