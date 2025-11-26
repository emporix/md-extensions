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
