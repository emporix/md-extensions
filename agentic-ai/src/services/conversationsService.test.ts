import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'

const { mockGetWithHeaders } = vi.hoisted(() => ({
  mockGetWithHeaders: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    getWithHeaders = mockGetWithHeaders
  },
}))

import { getConversations, hasConversations } from './conversationsService'

const appState: AppState = {
  tenant: 'testtenant',
  token: 'token',
  language: 'en',
  contentLanguage: 'en',
}

describe('conversationsService', () => {
  beforeEach(() => {
    mockGetWithHeaders.mockReset()
  })

  it('builds toolId filter query with pagination and sort', async () => {
    mockGetWithHeaders.mockResolvedValue({
      data: [
        {
          conversationId: 'conv-1',
          agentId: 'agent-1',
          conversationName: 'joke-channel-v2',
        },
      ],
      headers: new Headers({ 'X-Total-Count': '1' }),
    })

    const result = await getConversations(appState, {
      toolId: 'teams-tool-1',
      pageNumber: 2,
      pageSize: 25,
      sortBy: 'lastMessageAt',
      sortOrder: 'DESC',
    })

    expect(mockGetWithHeaders).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/conversations?sort=lastMessageAt%3ADESC&pageSize=25&pageNumber=2&q=toolId%3Ateams-tool-1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Total-Count': 'true' }),
      })
    )
    expect(result.totalCount).toBe(1)
    expect(result.conversations).toHaveLength(1)
    expect(result.conversations[0].conversationName).toBe('joke-channel-v2')
  })

  it('builds agentId scope and column filters', async () => {
    mockGetWithHeaders.mockResolvedValue({
      data: [],
      headers: new Headers({ 'X-Total-Count': '0' }),
    })

    await getConversations(appState, {
      agentId: 'agent-2',
      filters: {
        sessionId: 'session-1',
        conversationName: 'general',
      },
    })

    expect(mockGetWithHeaders).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/conversations?sort=lastMessageAt%3ADESC&q=agentId%3Aagent-2+sessionId%3A%7E%28session-1%29+conversationName%3A%7E%28general%29',
      expect.any(Object)
    )
  })

  it('returns false from hasConversations when total count is zero', async () => {
    mockGetWithHeaders.mockResolvedValue({
      data: [],
      headers: new Headers({ 'X-Total-Count': '0' }),
    })

    const exists = await hasConversations(appState, { toolId: 'teams-tool-1' })
    expect(exists).toBe(false)
  })

  it('returns true from hasConversations when total count is positive', async () => {
    mockGetWithHeaders.mockResolvedValue({
      data: [{ conversationId: 'conv-1' }],
      headers: new Headers({ 'X-Total-Count': '2' }),
    })

    const exists = await hasConversations(appState, { agentId: 'agent-1' })
    expect(exists).toBe(true)
  })
})
