import { describe, expect, it } from 'vitest'
import { ApiClientError } from '../services/apiClient'
import { formatApiError, formatErrorPayloadMessage } from './errorHelpers'

describe('formatErrorPayloadMessage', () => {
  it('returns trimmed plain string as-is', () => {
    expect(formatErrorPayloadMessage('Agent execution failed')).toBe(
      'Agent execution failed'
    )
  })

  it('parses JSON string payloads', () => {
    expect(
      formatErrorPayloadMessage('{"message":"Invalid request","details":[]}')
    ).toBe('Invalid request')
  })

  it('strips SSE data: prefix before parsing JSON', () => {
    expect(
      formatErrorPayloadMessage('data: {"message":"Stream error","details":[]}')
    ).toBe('Stream error')
  })

  it('joins primary message with detail messages', () => {
    expect(
      formatErrorPayloadMessage({
        message: 'Validation failed',
        details: [
          { message: 'Field is required', type: 'validation' },
          { message: 'Validation failed', type: 'validation' },
        ],
      })
    ).toBe('Validation failed: Field is required')
  })

  it('ignores disableable and force detail types', () => {
    expect(
      formatErrorPayloadMessage({
        message: 'Conflict',
        details: [
          { message: 'Agent already exists', type: 'disableable' },
          { message: 'Use force delete', type: 'force' },
        ],
      })
    ).toBe('Conflict')
  })
})

describe('formatApiError', () => {
  it('formats ApiClientError message with JSON payload extraction', () => {
    const err = new ApiClientError(
      '{"message":"Bad gateway","details":[]}',
      502
    )

    expect(formatApiError(err, 'Fallback')).toBe('Bad gateway')
  })

  it('falls back to ApiClientError message when not JSON', () => {
    const err = new ApiClientError('Request failed with status 500', 500)

    expect(formatApiError(err, 'Fallback')).toBe(
      'Request failed with status 500'
    )
  })

  it('formats plain Error message with JSON payload extraction', () => {
    const err = new Error('{"message":"Agent disabled","details":[]}')

    expect(formatApiError(err, 'Fallback')).toBe('Agent disabled')
  })

  it('returns fallback for unknown errors', () => {
    expect(formatApiError(null, 'Something went wrong')).toBe(
      'Something went wrong'
    )
  })
})
