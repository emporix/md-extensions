import { describe, expect, it } from 'vitest'
import { Tool } from '../types/Tool'
import {
  areSlackAgentToolsValid,
  getSlackToolAllowedOperations,
  toggleSlackNativeTool,
  updateSlackNativeToolAllowedOperations,
} from './slackRoutingHelpers'

const slackToolA: Tool = {
  id: 'slack-orders',
  name: 'Slack Orders',
  type: 'slack',
  config: {
    teamId: 'T1',
    defaultInboundAgentId: 'owner-slack',
  },
}

const slackToolB: Tool = {
  id: 'slack-default',
  name: 'Slack Default',
  type: 'slack',
  config: {
    teamId: 'T1',
    defaultInboundAgentId: 'agent-1',
    allowedOperations: ['sendMessage', 'createChannel'],
  },
}

const mcpTool: Tool = {
  id: 'mcp-1',
  name: 'MCP Tool',
  type: 'mcp',
  config: {},
}

const teamsTool: Tool = {
  id: 'teams-1',
  name: 'Teams',
  type: 'teams',
  config: { teamId: 'team-1', tenantId: 'tenant-1' },
}

describe('slackRoutingHelpers', () => {
  describe('toggleSlackNativeTool', () => {
    it('keeps only one Slack tool selected when checking a Slack tool', () => {
      const result = toggleSlackNativeTool(
        [{ id: 'slack-orders' }],
        [slackToolA, slackToolB, mcpTool],
        'slack-default',
        true
      )

      expect(result).toEqual([
        {
          id: 'slack-default',
          allowedOperations: getSlackToolAllowedOperations(slackToolB),
        },
      ])
    })

    it('does not remove Slack tools when toggling a non-Slack tool on', () => {
      const result = toggleSlackNativeTool(
        [{ id: 'slack-orders', allowedOperations: ['sendMessage'] }],
        [slackToolA, mcpTool],
        'mcp-1',
        true
      )

      expect(result).toEqual([
        { id: 'slack-orders', allowedOperations: ['sendMessage'] },
        { id: 'mcp-1' },
      ])
    })

    it('does not remove Slack tools when toggling a non-Slack tool off', () => {
      const result = toggleSlackNativeTool(
        [
          { id: 'slack-orders', allowedOperations: ['sendMessage'] },
          { id: 'mcp-1' },
        ],
        [slackToolA, mcpTool],
        'mcp-1',
        false
      )

      expect(result).toEqual([
        { id: 'slack-orders', allowedOperations: ['sendMessage'] },
      ])
    })
  })

  describe('updateSlackNativeToolAllowedOperations', () => {
    it('rejects operations not allowed by the catalog tool', () => {
      const attached = toggleSlackNativeTool(
        [],
        [slackToolB],
        'slack-default',
        true
      )

      const unchanged = updateSlackNativeToolAllowedOperations(
        attached,
        'slack-default',
        'collaborateOnChannel',
        true,
        slackToolB
      )

      expect(unchanged).toEqual(attached)
      expect(unchanged[0].allowedOperations).toEqual(['sendMessage', 'createChannel'])
    })

    it('can remove all allowed operations to an empty list', () => {
      const attached = toggleSlackNativeTool(
        [],
        [slackToolB],
        'slack-default',
        true
      )

      const withoutSendMessage = updateSlackNativeToolAllowedOperations(
        attached,
        'slack-default',
        'sendMessage',
        false,
        slackToolB
      )
      const empty = updateSlackNativeToolAllowedOperations(
        withoutSendMessage,
        'slack-default',
        'createChannel',
        false,
        slackToolB
      )

      expect(empty[0].allowedOperations).toEqual([])
    })
  })

  describe('areSlackAgentToolsValid', () => {
    it('allows zero or one Slack tool and rejects multiple Slack tools', () => {
      expect(areSlackAgentToolsValid([], [slackToolA, slackToolB])).toBe(true)

      expect(
        areSlackAgentToolsValid([{ id: 'slack-orders' }], [slackToolA, slackToolB])
      ).toBe(true)

      expect(
        areSlackAgentToolsValid(
          [{ id: 'slack-orders' }, { id: 'slack-default' }],
          [slackToolA, slackToolB]
        )
      ).toBe(false)
    })

    it('ignores non-Slack native tools when validating Slack selection', () => {
      expect(
        areSlackAgentToolsValid(
          [{ id: 'slack-orders' }, { id: 'mcp-1' }, { id: 'teams-1' }],
          [slackToolA, mcpTool, teamsTool]
        )
      ).toBe(true)
    })
  })
})
