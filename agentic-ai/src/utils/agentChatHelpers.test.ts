import { describe, expect, it } from 'vitest'
import {
  buildChatInvokePatchOperations,
  getChatInvokeGates,
  isCustomerOnlyRequiredScopes,
  isMissingApiTrigger,
  nextAgentId,
  nextAgentIdFromQuery,
  isTranscriptNearBottom,
  nextSessionId,
  nextThinkingText,
  nextToolActivityText,
  shouldShowAssistantActivity,
  shouldShowRecommendationEmpty,
  withApiEndpointTrigger,
  withEmployeeRequiredScope,
} from './agentChatHelpers'

describe('nextSessionId', () => {
  it('keeps the stored session across sends', () => {
    expect(nextSessionId(false, 'sess-1')).toBe('sess-1')
  })

  it('omits a session when none is stored', () => {
    expect(nextSessionId(false, null)).toBeNull()
  })

  it('clears the session when the conversation resets', () => {
    expect(nextSessionId(true, 'sess-1')).toBeNull()
  })
})

describe('isTranscriptNearBottom', () => {
  it('follows while the reader is at the bottom', () => {
    expect(isTranscriptNearBottom(520, 1000, 400)).toBe(true)
  })

  it('stops following once the reader scrolls up', () => {
    expect(isTranscriptNearBottom(100, 1000, 400)).toBe(false)
  })
})

describe('nextThinkingText', () => {
  it('appends each thinking chunk and clears on the next token', () => {
    const first = nextThinkingText(null, 'I will ')
    const second = nextThinkingText(first, 'look up quotes.')

    expect(second).toBe('I will look up quotes.')
    expect(nextThinkingText(second, null)).toBeNull()
  })
})

describe('nextToolActivityText', () => {
  it('clears the tool line when the stream ends the tool', () => {
    expect(nextToolActivityText(null)).toBeNull()
    expect(nextToolActivityText('   ')).toBeNull()
  })

  it('keeps a named tool', () => {
    expect(nextToolActivityText('search_orders')).toBe('search_orders')
  })
})

describe('shouldShowAssistantActivity', () => {
  it('keeps the activity line after the assistant already has text', () => {
    expect(shouldShowAssistantActivity(true, true, true, true)).toBe(true)
  })

  it('hides the activity line once text is showing and the tool has ended', () => {
    expect(shouldShowAssistantActivity(true, true, true, false)).toBe(false)
  })

  it('shows a status while the assistant bubble is still empty', () => {
    expect(shouldShowAssistantActivity(true, true, false, false)).toBe(true)
  })
})

describe('shouldShowRecommendationEmpty', () => {
  it('waits until an agent is selected', () => {
    expect(shouldShowRecommendationEmpty(true, false, false, 0)).toBe(false)
    expect(shouldShowRecommendationEmpty(true, true, false, 0)).toBe(true)
  })
})

describe('nextAgentId', () => {
  it('keeps the current agent while it stays enabled', () => {
    expect(nextAgentId('a', ['a', 'b'], true)).toBe('a')
  })

  it('does not retarget a conversation when the selected agent drops out', () => {
    expect(nextAgentId('a', ['b'], true)).toBe('a')
  })

  it('picks the first enabled agent when the transcript has no user message', () => {
    expect(nextAgentId(null, ['b'], false)).toBe('b')
    expect(nextAgentId('a', ['b'], false)).toBe('b')
  })
})

describe('nextAgentIdFromQuery', () => {
  it('selects the requested agent before the first enabled agent', () => {
    expect(
      nextAgentIdFromQuery(null, 'quote-agent', ['a', 'quote-agent'], false)
    ).toBe('quote-agent')
  })

  it('keeps a later manual selection', () => {
    expect(
      nextAgentIdFromQuery('a', 'quote-agent', ['a', 'quote-agent'], false)
    ).toBe('a')
  })

  it('falls back when the requested agent is not enabled', () => {
    expect(nextAgentIdFromQuery(null, 'disabled-agent', ['a'], false)).toBe('a')
  })
})

describe('isCustomerOnlyRequiredScopes', () => {
  it('returns false when scopes are empty or missing', () => {
    expect(isCustomerOnlyRequiredScopes(undefined)).toBe(false)
    expect(isCustomerOnlyRequiredScopes([])).toBe(false)
  })

  it('returns true only for a single customer scope', () => {
    expect(isCustomerOnlyRequiredScopes(['customer'])).toBe(true)
    expect(isCustomerOnlyRequiredScopes(['CUSTOMER'])).toBe(true)
  })

  it('returns false when employee or other scopes allow MD invoke', () => {
    expect(isCustomerOnlyRequiredScopes(['employee'])).toBe(false)
    expect(isCustomerOnlyRequiredScopes(['anonymous'])).toBe(false)
    expect(isCustomerOnlyRequiredScopes(['integration'])).toBe(false)
    expect(isCustomerOnlyRequiredScopes(['customer', 'employee'])).toBe(false)
  })
})

describe('isMissingApiTrigger', () => {
  it('returns true when triggers are missing or empty', () => {
    expect(isMissingApiTrigger(undefined)).toBe(true)
    expect(isMissingApiTrigger([])).toBe(true)
  })

  it('returns true when endpoint trigger is absent', () => {
    expect(isMissingApiTrigger([{ type: 'slack' }])).toBe(true)
    expect(isMissingApiTrigger([{ type: 'commerce_events' }])).toBe(true)
  })

  it('returns false when endpoint trigger exists', () => {
    expect(isMissingApiTrigger([{ type: 'endpoint' }])).toBe(false)
    expect(isMissingApiTrigger([{ type: 'ENDPOINT' }])).toBe(false)
  })
})

describe('getChatInvokeGates', () => {
  it('orders employee scope before api trigger', () => {
    expect(
      getChatInvokeGates({
        requiredScopes: ['customer'],
        triggers: [{ type: 'slack' }],
      })
    ).toEqual(['employee_scope', 'api_trigger'])
  })
})

describe('withEmployeeRequiredScope', () => {
  it('appends employee without duplicating', () => {
    expect(withEmployeeRequiredScope(['customer'])).toEqual([
      'customer',
      'employee',
    ])
    expect(withEmployeeRequiredScope(['employee'])).toEqual(['employee'])
  })
})

describe('withApiEndpointTrigger', () => {
  it('preserves existing triggers and adds endpoint', () => {
    const commerce = {
      type: 'commerce_events',
      config: { events: ['OrderCreated'] },
    }
    expect(withApiEndpointTrigger([commerce])).toEqual([
      commerce,
      { type: 'endpoint', config: null },
    ])
  })
})

describe('buildChatInvokePatchOperations', () => {
  it('builds replace patches for accepted gates', () => {
    const agent = {
      requiredScopes: ['customer'],
      triggers: [{ type: 'slack', config: null }],
    }
    expect(
      buildChatInvokePatchOperations(agent, ['employee_scope', 'api_trigger'])
    ).toEqual([
      {
        op: 'REPLACE',
        path: '/requiredScopes',
        value: ['customer', 'employee'],
      },
      {
        op: 'REPLACE',
        path: '/triggers',
        value: [
          { type: 'slack', config: null },
          { type: 'endpoint', config: null },
        ],
      },
    ])
  })
})
