import { describe, expect, it } from 'vitest'
import {
  applyTeamsGraphConsentToTool,
  createEmptyTeamsTool,
} from './toolHelpers'

describe('toolHelpers', () => {
  it('creates empty teams tool with optional tenant id', () => {
    expect(createEmptyTeamsTool()).toEqual({
      id: '',
      name: '',
      type: 'teams',
      config: {},
      enabled: true,
    })

    expect(createEmptyTeamsTool(' tenant-1 ')).toEqual({
      id: '',
      name: '',
      type: 'teams',
      config: { tenantId: 'tenant-1' },
      enabled: true,
    })
  })

  it('merges graph consent callback and draft into teams tool', () => {
    expect(
      applyTeamsGraphConsentToTool(
        createEmptyTeamsTool(),
        { status: 'success', providerTenantId: 'tenant-from-callback' },
        {
          toolType: 'teams',
          installStateId: 'state-1',
          toolId: ' teams-tool ',
          toolName: ' Support ',
          tenantId: 'tenant-from-draft',
        }
      )
    ).toEqual({
      id: 'teams-tool',
      name: 'Support',
      type: 'teams',
      enabled: true,
      config: { tenantId: 'tenant-from-callback' },
    })
  })

  it('falls back to draft tenant id when callback has none', () => {
    expect(
      applyTeamsGraphConsentToTool(
        createEmptyTeamsTool(),
        { status: 'success' },
        {
          toolType: 'teams',
          installStateId: 'state-1',
          tenantId: ' tenant-from-draft ',
        }
      )
    ).toEqual({
      id: '',
      name: '',
      type: 'teams',
      enabled: true,
      config: { tenantId: 'tenant-from-draft' },
    })
  })
})
