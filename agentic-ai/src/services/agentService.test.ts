import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'
import { COMMERCE_FILTER_ASSISTANT_I18N_KEYS } from '../utils/agentFilterDslHelpers'

const { mockPostSse, mockPost, mockPostForm } = vi.hoisted(() => ({
  mockPostSse: vi.fn(),
  mockPost: vi.fn(),
  mockPostForm: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    postSse = mockPostSse
    post = mockPost
    postForm = mockPostForm
  },
}))

import {
  chatWithAgent,
  chatWithAgentOnce,
  uploadChatImage,
} from './agentService'

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
    ).resolves.toEqual({ text: '{"filter":"value"}', provenance: null })

    expect(mockPostSse).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat-stream',
      { agentId: 'agent-1', message: 'build filter' },
      undefined
    )
  })

  it('returns provenance from the stream done event', async () => {
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'token', content: 'schema' },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-1',
          toolsUsed: [],
          mixins: {
            provenance: [
              {
                origin: 'ai_generated',
                contentVersion: 1,
                generationId: 'gen-stream',
                generatedAt: '2026-11-13T10:00:00Z',
                generator: 'agent-chat',
                model: 'gpt-4o-mini',
                reviewStatus: 'not_reviewed',
              },
            ],
          },
          metadata: {
            mixins: {
              provenance:
                'https://res.cloudinary.com/saas-ag/raw/upload/provenance_lswyqe.json',
            },
          },
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter')
    ).resolves.toEqual({
      text: 'schema',
      provenance: {
        mixins: {
          provenance: [
            {
              origin: 'ai_generated',
              contentVersion: 1,
              generationId: 'gen-stream',
              generatedAt: '2026-11-13T10:00:00Z',
              generator: 'agent-chat',
              model: 'gpt-4o-mini',
              reviewStatus: 'not_reviewed',
            },
          ],
        },
        metadata: {
          mixins: {
            provenance:
              'https://res.cloudinary.com/saas-ag/raw/upload/provenance_lswyqe.json',
          },
        },
      },
    })
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
    ).resolves.toEqual({ text: 'Hello world', provenance: null })

    expect(onToken).toHaveBeenCalledWith('Hello')
    expect(onToken).toHaveBeenLastCalledWith('Hello world')
    expect(onToolActivity).toHaveBeenCalledWith('search')
    expect(onToolActivity).toHaveBeenLastCalledWith(null)
  })

  it('reports an artifact without replacing the accumulated text', async () => {
    const onToken = vi.fn()
    const onArtifact = vi.fn()
    mockPostSse.mockReturnValue(
      createStream(
        { type: 'token', content: 'Here is the forest.' },
        {
          type: 'artifact',
          artifactId: 'asset-1',
          kind: 'image',
          filename: 'forest.png',
          mimeType: 'image/png',
          size: 12,
          status: 'ready',
        },
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
      chatWithAgent(appState, 'agent-1', 'draw a forest', {
        onToken,
        onArtifact,
      })
    ).resolves.toEqual({ text: 'Here is the forest.', provenance: null })

    expect(onToken).toHaveBeenCalledWith('Here is the forest.')
    expect(onArtifact).toHaveBeenCalledWith({
      artifactId: 'asset-1',
      kind: 'image',
      filename: 'forest.png',
      mimeType: 'image/png',
      size: 12,
      status: 'ready',
      errorCode: undefined,
      generationId: undefined,
    })
  })

  it('accepts an image-only reply', async () => {
    mockPostSse.mockReturnValue(
      createStream(
        {
          type: 'artifact',
          artifactId: 'asset-1',
          kind: 'image',
          filename: 'forest.png',
          mimeType: 'image/png',
          size: 12,
          status: 'ready',
        },
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
      chatWithAgent(appState, 'agent-1', 'draw a forest', {
        emptyResponseKey: COMMERCE_FILTER_ASSISTANT_I18N_KEYS.emptyResponse,
      })
    ).resolves.toEqual({ text: '', provenance: null })
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
    ).resolves.toEqual({ text: 'Analysis complete', provenance: null })

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
    ).resolves.toEqual({ text: 'Done', provenance: null })

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

  it('keeps the session id when the stream fails before done', async () => {
    const onSessionId = vi.fn()
    mockPostSse.mockReturnValue(
      createStream(
        {
          type: 'error',
          message: 'Agent execution failed',
          code: 'INTERNAL_ERROR',
        },
        {
          type: 'done',
          agentId: 'agent-1',
          agentType: 'generic',
          sessionId: 'sess-err',
          toolsUsed: [],
        }
      )
    )

    await expect(
      chatWithAgent(appState, 'agent-1', 'build filter', { onSessionId })
    ).rejects.toThrow('Agent execution failed')
    expect(onSessionId).toHaveBeenCalledWith('sess-err')
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
    ).resolves.toEqual({
      text: '{"hasRecommendations":true}',
      provenance: null,
    })

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

  it('returns provenance from the sync chat body', async () => {
    mockPost.mockResolvedValue({
      message: 'generated',
      mixins: {
        provenance: [
          {
            origin: 'ai_generated',
            contentVersion: 1,
            generationId: 'gen-1',
            generatedAt: '2026-11-13T10:00:00Z',
            generator: 'agent',
            model: 'gpt-4o-mini',
            reviewStatus: 'not_reviewed',
          },
        ],
      },
      metadata: { mixins: { provenance: 'https://schema' } },
    })

    await expect(
      chatWithAgentOnce(appState, 'agent-1', 'suggest')
    ).resolves.toEqual({
      text: 'generated',
      provenance: {
        mixins: {
          provenance: [
            {
              origin: 'ai_generated',
              contentVersion: 1,
              generationId: 'gen-1',
              generatedAt: '2026-11-13T10:00:00Z',
              generator: 'agent',
              model: 'gpt-4o-mini',
              reviewStatus: 'not_reviewed',
            },
          ],
        },
        metadata: { mixins: { provenance: 'https://schema' } },
      },
    })
  })

  it('reads the message when the response is an array', async () => {
    mockPost.mockResolvedValue([
      { message: '  {"hasRecommendations":false}  ' },
    ])

    await expect(
      chatWithAgentOnce(appState, 'agent-1', 'suggest')
    ).resolves.toEqual({
      text: '{"hasRecommendations":false}',
      provenance: null,
    })
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
    ).resolves.toEqual({ text: 'continued', provenance: null })

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

describe('chat image attachments', () => {
  beforeEach(() => {
    mockPostSse.mockReset()
    mockPost.mockReset()
    mockPostForm.mockReset()
  })

  it('uploads one image with the session header and without JSON content', async () => {
    mockPostForm.mockResolvedValue({ id: 'asset-1', sessionId: 'session-1' })
    const image = new File(['png'], 'forest.png', { type: 'image/png' })

    await expect(
      uploadChatImage(appState, 'agent-1', image, { sessionId: 'session-1' })
    ).resolves.toEqual({ id: 'asset-1', sessionId: 'session-1' })

    const [path, body, init] = mockPostForm.mock.calls[0]
    expect(path).toBe('/ai-service/testtenant/agentic/agent-1/attachments')
    expect(body).toBeInstanceOf(FormData)
    expect(init.headers['session-id']).toBe('session-1')
  })

  it('rejects an upload response that has no id', async () => {
    mockPostForm.mockResolvedValue({ sessionId: 'session-1' })
    const image = new File(['png'], 'forest.png', { type: 'image/png' })

    await expect(uploadChatImage(appState, 'agent-1', image)).rejects.toThrow(
      'chat_image_upload_failed'
    )
  })

  it('sends attachment ids with the chat stream', async () => {
    mockPostSse.mockReturnValue(
      createStream({
        type: 'token',
        content: 'done',
      })
    )

    await chatWithAgent(appState, 'agent-1', 'describe this', {
      sessionId: 'session-1',
      attachments: [
        {
          attachmentId: 'asset-1',
          purpose: 'chat image',
          caption: 'forest.png',
        },
      ],
    })

    expect(mockPostSse).toHaveBeenCalledWith(
      '/ai-service/testtenant/agentic/chat-stream',
      {
        agentId: 'agent-1',
        message: 'describe this',
        attachments: [
          {
            attachmentId: 'asset-1',
            purpose: 'chat image',
            caption: 'forest.png',
          },
        ],
      },
      { headers: { 'session-id': 'session-1' } }
    )
  })
})
