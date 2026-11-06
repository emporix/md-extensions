export type SseFrame = {
  readonly event: string
  readonly data: string
}

export type AgentChatStreamEvent =
  | { readonly type: 'token'; readonly content: string }
  | { readonly type: 'thinking'; readonly content: string }
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
      readonly type: 'artifact'
      readonly artifactId?: string
      readonly kind: 'image' | 'file'
      readonly filename: string
      readonly mimeType: string
      readonly size: number
      readonly status: 'ready' | 'failed' | 'pending'
      readonly errorCode?: string
      readonly generationId?: string
    }
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
  const dataLines: string[] = []

  for (const line of chunk.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }

  if (!event && dataLines.length === 0) {
    return null
  }

  return { event, data: dataLines.join('\n') }
}

export const parseSseFrames = (
  buffer: string
): {
  frames: SseFrame[]
  remainder: string
} => {
  const frames: SseFrame[] = []
  let remainder = buffer

  const findBoundary = (text: string): number => {
    const lf = text.indexOf('\n\n')
    const crlf = text.indexOf('\r\n\r\n')
    if (lf === -1) return crlf
    if (crlf === -1) return lf
    return Math.min(lf, crlf)
  }

  let boundary = findBoundary(remainder)
  while (boundary !== -1) {
    const chunk = remainder.slice(0, boundary)
    const isDoubleLineBreak =
      remainder.slice(boundary, boundary + 4) === '\r\n\r\n'
    remainder = remainder.slice(boundary + (isDoubleLineBreak ? 4 : 2))
    const frame = parseSseChunk(chunk)
    if (frame) {
      frames.push(frame)
    }
    boundary = findBoundary(remainder)
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

    buffer += decoder.decode()

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

  let payload: Record<string, unknown> = {}
  if (frame.data.length > 0) {
    try {
      payload = JSON.parse(frame.data) as Record<string, unknown>
    } catch (err) {
      return {
        type: 'error',
        message: `Invalid JSON in stream frame: ${err instanceof Error ? err.message : 'parse error'}`,
        code: 'INVALID_FRAME',
      }
    }
  }

  switch (frame.event) {
    case 'token':
      return {
        type: 'token',
        content: typeof payload.content === 'string' ? payload.content : '',
      }
    case 'thinking':
      return {
        type: 'thinking',
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
    case 'artifact': {
      const kind = payload.kind
      const status = payload.status
      const filename =
        typeof payload.filename === 'string' ? payload.filename : ''
      const mimeType =
        typeof payload.mime_type === 'string' ? payload.mime_type : ''
      const size = typeof payload.size === 'number' ? payload.size : -1
      const artifactId =
        typeof payload.artifact_id === 'string' && payload.artifact_id.trim()
          ? payload.artifact_id
          : undefined
      const generationId =
        typeof payload.generation_id === 'string' &&
        /^[A-Za-z0-9._:-]{1,128}$/.test(payload.generation_id)
          ? payload.generation_id
          : undefined
      if (
        (kind !== 'image' && kind !== 'file') ||
        (status !== 'ready' && status !== 'failed' && status !== 'pending') ||
        !filename ||
        !mimeType ||
        size < 0 ||
        (status === 'ready' && !artifactId) ||
        (status === 'pending' &&
          (kind !== 'image' || !generationId || Boolean(artifactId)))
      ) {
        return null
      }
      return {
        type: 'artifact',
        artifactId,
        kind,
        filename,
        mimeType,
        size,
        status,
        errorCode:
          typeof payload.error_code === 'string'
            ? payload.error_code
            : undefined,
        generationId,
      }
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
