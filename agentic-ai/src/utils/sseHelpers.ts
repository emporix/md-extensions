export type SseFrame = {
  readonly event: string
  readonly data: string
}

export type AgentChatStreamEvent =
  | { readonly type: 'token'; readonly content: string }
  | {
      readonly type: 'tool_start'
      readonly toolName: string
      readonly toolCallId: string
    }
  | {
      readonly type: 'tool_end'
      readonly toolName: string
      readonly toolCallId: string
    }
  | { readonly type: 'error'; readonly message: string; readonly code: string }
  | {
      readonly type: 'done'
      readonly agentId: string
      readonly agentType: string
      readonly sessionId: string
      readonly toolsUsed: readonly string[]
      readonly ttftMs?: number
    }

const parseSseChunk = (chunk: string): SseFrame | null => {
  if (!chunk.trim() || chunk.startsWith(':')) {
    return null
  }

  let event = ''
  let data = ''

  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      data = line.slice('data:'.length).trim()
    }
  }

  if (!event && !data) {
    return null
  }

  return { event, data }
}

export const parseSseFrames = (buffer: string): {
  frames: SseFrame[]
  remainder: string
} => {
  const frames: SseFrame[] = []
  let remainder = buffer

  let boundary = remainder.indexOf('\n\n')
  while (boundary !== -1) {
    const chunk = remainder.slice(0, boundary)
    remainder = remainder.slice(boundary + 2)
    const frame = parseSseChunk(chunk)
    if (frame) {
      frames.push(frame)
    }
    boundary = remainder.indexOf('\n\n')
  }

  return { frames, remainder }
}

export async function* readSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SseFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parsed = parseSseFrames(buffer)
      buffer = parsed.remainder

      for (const frame of parsed.frames) {
        yield frame
      }
    }

    if (buffer.trim()) {
      const frame = parseSseChunk(buffer)
      if (frame) {
        yield frame
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export const mapAgentChatStreamEvent = (
  frame: SseFrame
): AgentChatStreamEvent | null => {
  if (!frame.event) {
    return null
  }

  const payload =
    frame.data.length > 0
      ? (JSON.parse(frame.data) as Record<string, unknown>)
      : {}

  switch (frame.event) {
    case 'token':
      return {
        type: 'token',
        content: typeof payload.content === 'string' ? payload.content : '',
      }
    case 'tool_start':
      return {
        type: 'tool_start',
        toolName: String(payload.tool_name ?? ''),
        toolCallId: String(payload.tool_call_id ?? ''),
      }
    case 'tool_end':
      return {
        type: 'tool_end',
        toolName: String(payload.tool_name ?? ''),
        toolCallId: String(payload.tool_call_id ?? ''),
      }
    case 'error':
      return {
        type: 'error',
        message: String(payload.message ?? 'Stream error'),
        code: String(payload.code ?? 'INTERNAL_ERROR'),
      }
    case 'done':
      return {
        type: 'done',
        agentId: String(payload.agent_id ?? ''),
        agentType: String(payload.agent_type ?? ''),
        sessionId: String(payload.session_id ?? ''),
        toolsUsed: Array.isArray(payload.tools_used)
          ? payload.tools_used.map(String)
          : [],
        ttftMs:
          typeof payload.ttft_ms === 'number' ? payload.ttft_ms : undefined,
      }
    default:
      return null
  }
}
