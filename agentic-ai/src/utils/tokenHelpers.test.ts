import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { createEmptyToken, getTokenTypeLabel } from './tokenHelpers'

const mockT = ((key: string) => key) as unknown as TFunction

describe('createEmptyToken', () => {
  it('returns a valid empty token', () => {
    expect(createEmptyToken()).toEqual({
      id: '',
      name: '',
      value: '',
    })
  })
})

describe('getTokenTypeLabel', () => {
  it('returns OpenAI label when token id contains openai', () => {
    expect(getTokenTypeLabel(mockT, 'my-openai-token')).toBe(
      'llm_provider_openai'
    )
  })

  it('returns Anthropic label when token id contains anthropic', () => {
    expect(getTokenTypeLabel(mockT, 'anthropic-api-key')).toBe(
      'token_type_anthropic'
    )
  })

  it('returns Emporix label when token id contains emporix', () => {
    expect(getTokenTypeLabel(mockT, 'emporix-service-token')).toBe('emporix')
  })

  it('returns API token label for other ids', () => {
    expect(getTokenTypeLabel(mockT, 'custom-api-key')).toBe('token_type_api')
  })
})
