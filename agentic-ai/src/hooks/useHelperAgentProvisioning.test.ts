import { describe, expect, it } from 'vitest'
import { isEnabledAgentPresent } from './useHelperAgentProvisioning'

describe('isEnabledAgentPresent', () => {
  const agents = [
    { id: 'quote-agent', enabled: true },
    { id: 'emporix-chat-recommended-prompts-assistant', enabled: false },
  ]

  it('requires the helper to be present and enabled', () => {
    expect(
      isEnabledAgentPresent(
        agents,
        'emporix-chat-recommended-prompts-assistant'
      )
    ).toBe(false)
    expect(
      isEnabledAgentPresent(
        [
          ...agents.slice(0, 1),
          { id: 'emporix-chat-recommended-prompts-assistant', enabled: true },
        ],
        'emporix-chat-recommended-prompts-assistant'
      )
    ).toBe(true)
  })

  it('is false when the list does not include the helper', () => {
    expect(isEnabledAgentPresent(agents, 'missing-agent')).toBe(false)
  })
})
