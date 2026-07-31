import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

const appState: AppState = {
  tenant: 'testtenant',
  token: 'token',
  language: 'en',
  contentLanguage: 'en',
}

const encode = (value: string) => new TextEncoder().encode(value)

describe('ApiClient.postSse', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ApiClientError on HTTP failure before stream starts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Forbidden' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        })
      )
    )

    const client = new ApiClient(appState)

    await expect(async () => {
      for await (const _event of client.postSse(
        '/ai-service/testtenant/agentic/chat-stream',
        {
          agentId: 'agent-1',
          message: 'hello',
        }
      )) {
        // no-op
      }
    }).rejects.toMatchObject({
      message: 'Forbidden',
      status: 403,
      name: 'ApiClientError',
    })
  })

  it('yields mapped token and done events from SSE stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          encode(
            'event: token\ndata: {"content":"Hello"}\n\nevent: done\ndata: {"agent_id":"agent-1","agent_type":"generic","session_id":"sess-1","tools_used":[]}\n\n'
          ),
          {
            status: 200,
            headers: { 'content-type': 'text/event-stream' },
          }
        )
      )
    )

    const client = new ApiClient(appState)
    const events = []
    for await (const event of client.postSse('/path', {})) {
      events.push(event)
    }

    expect(events).toEqual([
      { type: 'token', content: 'Hello' },
      {
        type: 'done',
        agentId: 'agent-1',
        agentType: 'generic',
        sessionId: 'sess-1',
        toolsUsed: [],
        ttftMs: undefined,
      },
    ])
  })
})
