import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'
import { COMMERCE_FILTER_ASSISTANT_I18N_KEYS } from '../utils/agentFilterDslHelpers'

const { mockPostSse, mockPost } = vi.hoisted(() => ({
  mockPostSse: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    postSse = mockPostSse
    post = mockPost
  },
}))

import { chatWithAgent, chatWithAgentOnce } from './agentService'

const appState: AppState = {
  tenant: 'testtenant',
  token: 'token',
  language: 'en',
  contentLanguage: 'en',
}

const createStream = (
  ...events: Array<{ type: string; [key: string]: unknown }>
) =>
  (async function* () {
    for (const event of events) {
      yield event
    }
  })()

describe('chatWithAgent', () => {
  beforeEach(() => {
    mockPostSse.mockReset()
  })

  it('calls chat-stream and returns accumulated tokens', async () => {
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'token', content: '{"filter":' },
        { type: 'token', content: '"value"}' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-1',
          toolsUsed: [],
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter')
    ).resolves.toBe('{"filter":"value"}')

    expect(mockPostSse).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat-stream',
      { agentId: 'agent-1', message: 'build filter' },
      undefined
    )
  })

  it('throws empty response key when stream completes without tokens', async () => {
    mockPostSse.mockReturnValue(
      createStream({
        type: 'done',
        agentId: 'agent-1',
        agentType: 'generic',
        sessionId: 'sess-1',
        toolsUsed: [],
      })
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter')
    ).rejects.toThrow(COMMERCE_FILTER_ASSISTANT_I18N_KEYS.emptyResponse)
  })

  it('invokes stream callbacks for tokens and tool activity', async () => {
    const onToken = vi.fn()
    const onToolActivity = vi.fn()
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'tool_start', toolName: 'search', toolCallId: '1' },
        { type: 'token', content: 'Hello' },
        { type: 'tool_end', toolName: 'search', toolCallId: '1' },
        { type: 'token', content: ' world' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-1',
          toolsUsed: ['search'],
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter', {
        onToken,
        onToolActivity,
      })
    ).resolves.toBe('Hello world')

    expect(onToken).toHaveBeenCalledWith('Hello')
    expect(onToken).toHaveBeenLastCalledWith('Hello world')
    expect(onToolActivity).toHaveBeenCalledWith('search')
    expect(onToolActivity).toHaveBeenLastCalledWith(null)
  })

  it('passes session-id header and onSessionId callback when provided', async () => {
    const onSessionId = vi.fn()
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'token', content: 'Analysis complete' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-continuity',
          toolsUsed: [],
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'analyze logs', {
        sessionId: 'sess-existing',
        onSessionId,
      })
    ).resolves.toBe('Analysis complete')

    expect(mockPostSse).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat-stream',
      { agentId: 'agent-1', message: 'analyze logs' },
      { headers: { 'session-id': 'sess-existing' } }
    )
    expect(onSessionId).toHaveBeenCalledWith('sess-continuity')
  })

  it('clears thinking when the next token arrives', async () => {
    const onThinking = vi.fn()
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'thinking', content: 'Checking stock' },
        { type: 'token', content: 'Done' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-1',
          toolsUsed: [],
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter', { onThinking })
    ).resolves.toBe('Done')

    expect(onThinking).toHaveBeenNthCalledWith(1, 'Checking stock')
    expect(onThinking).toHaveBeenNthCalledWith(2, null)
  })

  it('forwards the abort signal to the stream request', async () => {
    const controller = new AbortController()
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'token', content: 'Hi' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-1',
          toolsUsed: [],
        }
      )
    )

    await chatWithAgent(appState, 'agent-1', 'build filter', {
      signal: controller.signal,
    })

    expect(mockPostSse).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat-stream',
      { agentId: 'agent-1', message: 'build filter' },
      { signal: controller.signal }
    )
  })

  it('throws on stream error events', async () => {
    mockPostSse.mockReturnValue(
      createStream({
        type: 'error',
        message: 'Agent execution failed',
        code: 'INTERNAL_ERROR',
      })
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter')
    ).rejects.toThrow('Agent execution failed')
  })
})

describe('chatWithAgentOnce', () => {
  beforeEach(() => {
    mockPost.mockReset()
    mockPostSse.mockReset()
  })

  it('calls the sync chat endpoint and returns the message', async () => {
    mockPost.mockResolvedValue({
      agentId: 'chat-recommended-prompts-assistant',
      message: '{"hasRecommendations":true}',
    })

    await expect(
      chatWithAgentOnce(
        appState,
        'chat-recommended-prompts-assistant',
        'suggest'
      )
    ).resolves.toBe('{"hasRecommendations":true}')

    expect(mockPost).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat',
      {
        agentId: 'chat-recommended-prompts-assistant',
        message: 'suggest',
      },
      undefined
    )
    expect(mockPostSse).not.toHaveBeenCalled()
  })

  it('reads the message when the response is an array', async () => {
    mockPost.mockResolvedValue([
      { message: '  {"hasRecommendations":false}  ' },
    ])

    await expect(
      chatWithAgentOnce(appState, 'agent-1', 'suggest')
    ).resolves.toBe('{"hasRecommendations":false}')
  })

  it('throws when the sync response has no message', async () => {
    mockPost.mockResolvedValue({ message: '   ' })

    await expect(
      chatWithAgentOnce(appState, 'agent-1', 'suggest', {
        emptyResponseKey: 'chat_error',
      })
    ).rejects.toThrow('chat_error')
  })

  it('sends the current session and keeps the returned session', async () => {
    const onSessionId = vi.fn()
    mockPost.mockResolvedValue({
      message: 'continued',
      sessionId: 'sess-returned',
    })

    await expect(
      chatWithAgentOnce(appState, 'agent-1', 'retry', {
        sessionId: 'sess-existing',
        onSessionId,
      })
    ).resolves.toBe('continued')

    expect(mockPost).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat',
      { agentId: 'agent-1', message: 'retry' },
      { headers: { 'session-id': 'sess-existing' } }
    )
    expect(onSessionId).toHaveBeenCalledWith('sess-returned')
  })

  it('forwards the abort signal', async () => {
    const controller = new AbortController()
    mockPost.mockResolvedValue({ message: 'ok' })

    await chatWithAgentOnce(appState, 'agent-1', 'suggest', {
      signal: controller.signal,
    })

    expect(mockPost).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat',
      { agentId: 'agent-1', message: 'suggest' },
      { signal: controller.signal }
    )
  })
})
