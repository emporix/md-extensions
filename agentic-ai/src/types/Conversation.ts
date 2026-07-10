import { TimestampValue } from '../utils/formatHelpers'

export interface ConversationMetadata {
  createdAt?: TimestampValue
  modifiedAt?: TimestampValue
  version?: number
}

export interface Conversation {
  conversationId: string
  conversationName?: string
  contextRef?: string
  channelId?: string
  agentId?: string
  sessionId?: string
  lastMessageAt?: TimestampValue
  metadata?: ConversationMetadata
}

export interface GetConversationsOptions {
  toolId?: string
  agentId?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters?: Record<string, string>
}

export interface GetConversationsResult {
  conversations: Conversation[]
  totalCount?: number
}
