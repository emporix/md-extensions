import { describe, expect, it } from 'vitest'
import { Tool } from '../types/Tool'
import {
  getCommunicationToolAllowedOperations,
  isCommunicationNativeToolType,
} from './communicationRoutingHelpers'
import { getSlackToolAllowedOperations } from './slackRoutingHelpers'
import { getToolAllowedOperations } from './teamsRoutingHelpers'

const slackTool: Tool = {
  id: 'slack-1',
  name: 'Slack',
  type: 'slack',
  config: {
    teamId: 'T1',
    allowedOperations: ['sendMessage', 'createChannel'],
  },
}

const teamsTool: Tool = {
  id: 'teams-1',
  name: 'Teams',
  type: 'teams',
  config: {
    teamId: 'team-1',
    tenantId: 'tenant-1',
    allowedOperations: ['sendMessage', 'createChat'],
  },
}

describe('communicationRoutingHelpers', () => {
  it('isCommunicationNativeToolType accepts only teams and slack', () => {
    expect(isCommunicationNativeToolType('slack')).toBe(true)
    expect(isCommunicationNativeToolType('teams')).toBe(true)
    expect(isCommunicationNativeToolType('mcp')).toBe(false)
    expect(isCommunicationNativeToolType(undefined)).toBe(false)
  })

  it('getCommunicationToolAllowedOperations delegates by tool type', () => {
    expect(getCommunicationToolAllowedOperations(slackTool)).toEqual(
      getSlackToolAllowedOperations(slackTool)
    )
    expect(getCommunicationToolAllowedOperations(teamsTool)).toEqual(
      getToolAllowedOperations(teamsTool)
    )
  })
})
