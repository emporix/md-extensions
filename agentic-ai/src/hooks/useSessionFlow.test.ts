import { describe, expect, it } from 'vitest'
import { LogMessage } from '../types/Log'
import { buildSessionFlowNodes } from './useSessionFlow'

describe('buildSessionFlowNodes', () => {
  it('keeps business logs and uses extracted text for inbound/response', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Agent receive request: what is sum of 1+1',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
        requestId: 'req-1',
        isBusinessLog: true,
      },
      {
        severity: 'INFO',
        message: 'Tool called',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
        requestId: 'req-1',
        isBusinessLog: true,
      },
      {
        severity: 'INFO',
        message: 'Agent final response: The sum of 1 + 1 is 2.',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
        requestId: 'req-1',
        isBusinessLog: true,
      },
    ]

    const nodes = buildSessionFlowNodes(messages, 'session-1')

    expect(nodes).toHaveLength(3)
    expect(nodes[0].message).toBe('what is sum of 1+1')
    expect(nodes[1].message).toBe('Tool called')
    expect(nodes[2].message).toBe('The sum of 1 + 1 is 2.')
  })

  it('includes streaming LLM ended response even when not a business log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Agent receive streaming request: Review logs',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'log-analysis-assistant',
        requestId: 'req-stream',
        isBusinessLog: true,
      },
      {
        severity: 'INFO',
        message: 'Intermediate tool activity',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'log-analysis-assistant',
        requestId: 'req-stream',
        isBusinessLog: true,
      },
      {
        severity: 'INFO',
        message:
          "LLM ended (run #1) for agent: 'log-analysis-assistant' with response: Analysis complete",
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'log-analysis-assistant',
        requestId: 'req-stream',
        isBusinessLog: false,
      },
    ]

    const nodes = buildSessionFlowNodes(messages, 'session-stream')

    expect(nodes).toHaveLength(3)
    expect(nodes[0].message).toBe('Review logs')
    expect(nodes[1].message).toBe('Intermediate tool activity')
    expect(nodes[2].message).toBe('Analysis complete')
    expect(nodes[2].id).toBe('req-stream')
    expect(nodes[2].agentId).toBe('log-analysis-assistant')
  })

  it('does not duplicate response when it is already a business log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Agent receive request: hello',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
        requestId: 'req-1',
        isBusinessLog: true,
      },
      {
        severity: 'INFO',
        message: 'Agent final response: hi there',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
        requestId: 'req-1',
        isBusinessLog: true,
      },
    ]

    const nodes = buildSessionFlowNodes(messages, 'session-1')

    expect(nodes).toHaveLength(2)
    expect(nodes.map((node) => node.message)).toEqual(['hello', 'hi there'])
  })
})
