import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'
import { COMMERCE_FILTER_ASSISTANT_I18N_KEYS } from '../utils/agentFilterDslHelpers'

const { mockPostSse } = vi.hoisted(() => ({
  mockPostSse: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    postSse = mockPostSse
  },
}))

import { chatWithAgent } from './agentService'

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
