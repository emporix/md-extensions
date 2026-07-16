import { describe, expect, it } from 'vitest'
import { Tool } from '../types/Tool'
import {
  applyTeamsToolDefaults,
  areTeamsAgentToolsValid,
  getSelectedTeamsToolIds,
  getToolAllowedOperations,
  teamsNativeToolHasAllowedOperations,
  toTeamsToolConfigForSave,
  toggleTeamsNativeTool,
  updateTeamsNativeToolAllowedOperations,
} from './teamsRoutingHelpers'

const teamsToolA: Tool = {
  id: 'teams-orders',
  name: 'Teams Orders',
  type: 'teams',
  config: {
    teamId: 'team-1',
    tenantId: 'tenant-1',
    defaultInboundAgentId: 'owner-teams',
  },
}

const teamsToolB: Tool = {
  id: 'teams-default',
  name: 'Teams Default',
  type: 'teams',
  config: {
    teamId: 'team-1',
    tenantId: 'tenant-1',
    defaultInboundAgentId: 'agent-1',
  },
}

const slackTool: Tool = {
  id: 'slack-1',
  name: 'Slack',
  type: 'slack',
  config: { teamId: 'T1' },
}

describe('teamsRoutingHelpers', () => {
  it('applyTeamsToolDefaults fills collaboration defaults', () => {
    expect(
      applyTeamsToolDefaults({
        teamId: 'team-1',
        tenantId: 'tenant-1',
      }).allowedOperations
    ).toEqual([
      'sendMessage',
      'createChat',
      'createChannel',
      'inviteParticipants',
      'collaborateOnChannel',
      'collaborateOnChat',
    ])
  })

  it('toggleTeamsNativeTool keeps only one Teams tool selected', () => {
    const result = toggleTeamsNativeTool(
      [{ id: 'teams-orders' }],
      [teamsToolA, teamsToolB, slackTool],
      'teams-default',
      true
    )

    expect(result).toEqual([
      {
        id: 'teams-default',
        allowedOperations: getToolAllowedOperations(teamsToolB),
      },
    ])
  })

  it('updateTeamsNativeToolAllowedOperations toggles agent operation subset', () => {
    const attached = toggleTeamsNativeTool(
      [],
      [teamsToolA],
      'teams-orders',
      true
    )

    const reduced = updateTeamsNativeToolAllowedOperations(
      attached,
      'teams-orders',
      'sendMessage',
      false,
      teamsToolA
    )

    expect(reduced[0].allowedOperations).not.toContain('sendMessage')
    expect(reduced[0].allowedOperations?.length).toBeGreaterThan(0)
  })

  it('teamsNativeToolHasAllowedOperations requires at least one operation', () => {
    expect(
      teamsNativeToolHasAllowedOperations(
        { id: 'teams-orders', allowedOperations: ['sendMessage'] },
        teamsToolA
      )
    ).toBe(true)
    expect(
      teamsNativeToolHasAllowedOperations(
        { id: 'teams-orders', allowedOperations: [] },
        teamsToolA
      )
    ).toBe(false)
  })

  it('areTeamsAgentToolsValid allows at most one Teams tool', () => {
    expect(
      areTeamsAgentToolsValid(
        [{ id: 'teams-orders' }],
        [teamsToolA, teamsToolB]
      )
    ).toBe(true)

    expect(
      areTeamsAgentToolsValid(
        [{ id: 'teams-orders' }, { id: 'teams-default' }],
        [teamsToolA, teamsToolB]
      )
    ).toBe(false)
  })

  it('toTeamsToolConfigForSave omits blank defaultInboundAgentId', () => {
    expect(
      toTeamsToolConfigForSave({
        teamId: 'team-1',
        tenantId: 'tenant-1',
        defaultInboundAgentId: '   ',
      })
    ).toEqual({
      teamId: 'team-1',
      tenantId: 'tenant-1',
      allowedOperations: applyTeamsToolDefaults({}).allowedOperations,
    })
  })

  it('getSelectedTeamsToolIds ignores non-Teams native tools', () => {
    expect(
      getSelectedTeamsToolIds(
        [{ id: 'teams-orders' }, { id: 'slack-1' }],
        [teamsToolA, slackTool]
      )
    ).toEqual(['teams-orders'])
  })
})
