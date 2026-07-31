import { describe, expect, it } from 'vitest'
import {
  mapAgentChatStreamEvent,
  parseSseFrames,
  readSseStream,
} from './sseHelpers'

const encode = (value: string) => new TextEncoder().encode(value)

const streamFromChunks = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encode(chunk))
      }
      controller.close()
    },
  })

describe('sseHelpers', () => {
  it('parses SSE frames split across chunk boundaries', () => {
    const first = parseSseFrames('event: token\ndata: {"content":"Hel')
    expect(first.frames).toHaveLength(0)

    const second = parseSseFrames(`${first.remainder}lo"}\n\n`)
    expect(second.frames).toHaveLength(1)
    expect(second.frames[0]).toEqual({
      event: 'token',
      data: '{"content":"Hello"}',
    })
  })

  it('ignores keepalive comments', async () => {
    const frames: string[] = []
    for await (const frame of readSseStream(
      streamFromChunks([
        ': keepalive\n\n',
        'event: token\ndata: {"content":"Hi"}\n\n',
      ])
    )) {
      frames.push(`${frame.event}:${frame.data}`)
    }

    expect(frames).toEqual(['token:{"content":"Hi"}'])
  })

  it('maps token, error, and done events', () => {
    expect(
      mapAgentChatStreamEvent({
        event: 'token',
        data: '{"content":"Hello world"}',
      })
    ).toEqual({ type: 'token', content: 'Hello world' })

    expect(
      mapAgentChatStreamEvent({
        event: 'error',
        data: '{"message":"Quota exceeded","code":"INTERNAL_ERROR"}',
      })
    ).toEqual({
      type: 'error',
      message: 'Quota exceeded',
      code: 'INTERNAL_ERROR',
    })

    expect(
      mapAgentChatStreamEvent({
        event: 'done',
        data: '{"agent_id":"agent-1","agent_type":"generic","session_id":"sess-1","tools_used":["search"],"ttft_ms":123.4}',
      })
    ).toEqual({
      type: 'done',
      agentId: 'agent-1',
      agentType: 'generic',
      sessionId: 'sess-1',
      toolsUsed: ['search'],
      ttftMs: 123.4,
    })
  })
})
