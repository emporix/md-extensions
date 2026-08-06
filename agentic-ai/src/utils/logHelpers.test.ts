import { describe, it, expect } from 'vitest'
import {
  extractInitialMessageFromLog,
  extractResponseFromLog,
} from './logHelpers'
import { LogMessage } from '../types/Log'

describe('extractInitialMessageFromLog', () => {
  it('should extract message when one of messages starts with "Agent receive request:"', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Agent receive request: Hello, how can I help you?',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractInitialMessageFromLog(messages)

    expect(result).toBe('Hello, how can I help you?')
  })

  it('should extract message when one of messages starts with "Processing Slack message for user:"', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message:
          'Processing Slack message for user: user123, message: What is the weather today?',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractInitialMessageFromLog(messages)

    expect(result).toBe('What is the weather today?')
  })

  it('should extract message from routed Slack inbound log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message:
          'Processing routed Slack message user=U09JCUVGXL3 channel=C0BL5DJAYSH message=what is sum of 1+1',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'slack-agent',
      },
    ]

    expect(extractInitialMessageFromLog(messages)).toBe('what is sum of 1+1')
  })

  it('should extract message from Teams inbound log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message:
          "Processing Teams message for conversation 'order-eon444' from user: s.mendla, message: hello there",
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'teams-agent',
      },
    ]

    expect(extractInitialMessageFromLog(messages)).toBe('hello there')
  })

  it('should return undefined when no message matches the patterns', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message without match',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'ERROR',
        message: 'An error occurred',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractInitialMessageFromLog(messages)

    expect(result).toBeUndefined()
  })

  it('should return undefined when messages is undefined', () => {
    const result = extractInitialMessageFromLog(undefined)

    expect(result).toBeUndefined()
  })

  it('should return undefined when messages is empty array', () => {
    const result = extractInitialMessageFromLog([])

    expect(result).toBeUndefined()
  })
})

describe('extractResponseFromLog', () => {
  it('should extract response when one of messages starts with "Agent final response:"', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Agent final response: The weather is sunny today!',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractResponseFromLog(messages)

    expect(result).toBe('The weather is sunny today!')
  })

  it('should extract response when one of messages starts with "Slack message sent successfully:"', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message:
          'Slack message sent successfully: Your order has been processed.',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractResponseFromLog(messages)

    expect(result).toBe('Your order has been processed.')
  })

  it('should extract response from routed Slack success log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message:
          'Slack routed message sent successfully (channel=C0BL5DJAYSH, message=The sum of 1 + 1 is 2.)',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'slack-agent',
      },
    ]

    expect(extractResponseFromLog(messages)).toBe('The sum of 1 + 1 is 2.')
  })

  it('should extract response from Teams success log', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message:
          "Teams message sent successfully (conversation='order-eon444', message=Hello from Teams)",
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'teams-agent',
      },
    ]

    expect(extractResponseFromLog(messages)).toBe('Hello from Teams')
  })

  it('should extract the last matching response when multiple response lines exist', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Agent final response: Old reply from retry',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'slack-agent',
      },
      {
        severity: 'INFO',
        message:
          'Slack routed message sent successfully (channel=C0BL5DJAYSH, message=Latest reply)',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'slack-agent',
      },
    ]

    expect(extractResponseFromLog(messages)).toBe('Latest reply')
  })

  it('should extract the first matching inbound message when multiple inbound lines exist', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message:
          'Processing routed Slack message user=U123 channel=C456 message=first question',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'slack-agent',
      },
      {
        severity: 'INFO',
        message:
          'Processing routed Slack message user=U123 channel=C456 message=second question',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'slack-agent',
      },
    ]

    expect(extractInitialMessageFromLog(messages)).toBe('first question')
  })

  it('should return undefined when no message matches the patterns', () => {
    const messages: LogMessage[] = [
      {
        severity: 'INFO',
        message: 'Some other log message',
        timestamp: '2024-01-01T00:00:00Z',
        agentId: 'agent-1',
      },
      {
        severity: 'INFO',
        message: 'Another log message without match',
        timestamp: '2024-01-01T00:00:01Z',
        agentId: 'agent-1',
      },
      {
        severity: 'ERROR',
        message: 'An error occurred',
        timestamp: '2024-01-01T00:00:02Z',
        agentId: 'agent-1',
      },
    ]

    const result = extractResponseFromLog(messages)

    expect(result).toBeUndefined()
  })

  it('should return undefined when messages is undefined', () => {
    const result = extractResponseFromLog(undefined)

    expect(result).toBeUndefined()
  })

  it('should return undefined when messages is empty array', () => {
    const result = extractResponseFromLog([])

    expect(result).toBeUndefined()
  })
})
