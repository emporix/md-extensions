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

describe('ApiClient.getBoundedArrayBuffer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('stops reading once the response exceeds the byte limit', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(100))
        controller.enqueue(new Uint8Array(100))
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(stream, { status: 200 }))
    )

    const client = new ApiClient(appState)

    await expect(
      client.getBoundedArrayBuffer('/media/asset', 150)
    ).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 200,
    })
  })
})

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
      for await (const event of client.postSse(
        '/ai-service/testtenant/agentic/chat-stream',
        {
          agentId: 'agent-1',
          message: 'hello',
        }
      )) {
        void event
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

  it('posts form data without forcing a JSON content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'asset-1', sessionId: 'session-1' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)
    const body = new FormData()
    body.append('attachment', new Blob(['png'], { type: 'image/png' }), 'a.png')

    const client = new ApiClient(appState)
    await expect(
      client.postForm(
        '/ai-service/testtenant/agentic/agent-1/attachments',
        body,
        {
          headers: { 'session-id': 'session-1' },
        }
      )
    ).resolves.toEqual({ id: 'asset-1', sessionId: 'session-1' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(init.body).toBe(body)
    expect(headers['Content-Type']).toBeUndefined()
    expect(headers.Authorization).toBe('Bearer token')
    expect(headers['Emporix-tenant']).toBe('testtenant')
    expect(headers['session-id']).toBe('session-1')
  })
})
