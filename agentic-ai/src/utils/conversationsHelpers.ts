import { Conversation } from '../types/Conversation'
import { formatTimestamp, normalizeTimestampInput } from './formatHelpers'

const truncateLabel = (value: string, maxLength = 48): string => {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLength - 3)}...`
}

export const resolveConversationLabel = (
  conversation: Conversation
): string => {
  const conversationName = conversation.conversationName?.trim()
  if (conversationName) {
    return conversationName
  }

  const contextRef = conversation.contextRef?.trim()
  if (contextRef) {
    return contextRef
  }

  const channelId = conversation.channelId?.trim()
  if (channelId) {
    return truncateLabel(channelId)
  }

  const conversationId = conversation.conversationId?.trim() ?? ''
  return truncateLabel(conversationId)
}

export const formatConversationTimestamp = (
  lastMessageAt?: Conversation['lastMessageAt'],
  fallback = 'N/A'
): string => {
  const normalized = normalizeTimestampInput(lastMessageAt)
  if (!normalized) {
    return fallback
  }

  const formatted = formatTimestamp(normalized)
  if (!formatted || formatted === 'Invalid Date') {
    return fallback
  }

  return formatted
}
