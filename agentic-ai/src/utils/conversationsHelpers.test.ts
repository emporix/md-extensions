import { describe, expect, it } from 'vitest'
import { Conversation } from '../types/Conversation'
import {
  formatConversationTimestamp,
  resolveConversationLabel,
} from './conversationsHelpers'

const baseConversation: Conversation = {
  conversationId: '19:very-long-conversation-id@thread.tacv2',
  channelId: '19:channel-id@thread.tacv2',
  contextRef: 'order-123',
}

describe('conversationsHelpers', () => {
  it('prefers conversationName over other labels', () => {
    expect(
      resolveConversationLabel({
        ...baseConversation,
        conversationName: 'joke-channel-v2',
      })
    ).toBe('joke-channel-v2')
  })

  it('falls back to contextRef when conversationName is missing', () => {
    expect(resolveConversationLabel(baseConversation)).toBe('order-123')
  })

  it('falls back to channelId when contextRef is missing', () => {
    expect(
      resolveConversationLabel({
        conversationId: '19:conv@thread.tacv2',
        channelId: '19:channel-id@thread.tacv2',
      })
    ).toBe('19:channel-id@thread.tacv2')
  })

  it('formats ISO timestamps via shared helper', () => {
    const formatted = formatConversationTimestamp('2026-07-07T12:34:56.000Z')
    expect(formatted).not.toBe('N/A')
    expect(formatted).toContain('2026')
  })

  it('returns fallback for missing timestamp', () => {
    expect(formatConversationTimestamp(undefined, 'N/A')).toBe('N/A')
  })

  it('formats numeric epoch timestamps', () => {
    const formatted = formatConversationTimestamp(1_752_000_000_000)
    expect(formatted).not.toBe('N/A')
  })

  it('formats mongo-style date objects', () => {
    const formatted = formatConversationTimestamp({
      $date: '2026-07-07T12:34:56.000Z',
    })
    expect(formatted).toContain('2026')
  })
})
