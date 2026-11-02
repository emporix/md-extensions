export type TimestampValue =
  | string
  | number
  | Date
  | { $date?: string }
  | null
  | undefined

export const normalizeEscapedNewlines = (message: string): string =>
  message.replace(/\\n/g, '\n')

const CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i

const isJsonStructure = (
  value: unknown
): value is Record<string, unknown> | unknown[] =>
  value !== null && typeof value === 'object'

const tryParseJsonStructure = (text: string): unknown | null => {
  try {
    let parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'string') {
      const inner = parsed.trim()
      if (inner.startsWith('{') || inner.startsWith('[')) {
        parsed = JSON.parse(inner)
      }
    }
    if (isJsonStructure(parsed)) {
      return parsed
    }
  } catch {
    return null
  }
  return null
}

/** Pretty-print JSON message/response bodies; otherwise normalize escaped newlines. */
export const formatReadableCommunicationContent = (content: string): string => {
  const trimmed = content.trim()
  if (!trimmed) {
    return content
  }

  const candidates = [trimmed]
  const codeMatch = CODE_BLOCK_REGEX.exec(trimmed)
  if (codeMatch?.[1]) {
    candidates.unshift(codeMatch[1].trim())
  }

  for (const candidate of candidates) {
    const parsed = tryParseJsonStructure(candidate)
    if (parsed !== null) {
      return JSON.stringify(parsed, null, 2)
    }
  }

  return normalizeEscapedNewlines(content)
}

const fencedJson = (value: unknown): string =>
  `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``

const matchingJsonEnd = (text: string, start: number): number => {
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') {
      stack.push(char === '{' ? '}' : ']')
      continue
    }
    if (char === '}' || char === ']') {
      if (stack.pop() !== char) {
        return -1
      }
      if (stack.length === 0) {
        return index
      }
    }
  }

  return -1
}

const prettyFenceBlock = (block: string): string => {
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(block)
  const body = match?.[1]?.trim()
  if (!body) {
    return block
  }
  const parsed = tryParseJsonStructure(body)
  if (parsed === null) {
    return block
  }
  return fencedJson(parsed)
}

const replaceTopLevelJson = (text: string): string => {
  let result = ''
  let index = 0

  while (index < text.length) {
    if (text.startsWith('```', index)) {
      const close = text.indexOf('```', index + 3)
      if (close === -1) {
        result += text.slice(index)
        break
      }
      const block = text.slice(index, close + 3)
      result += prettyFenceBlock(block)
      index = close + 3
      continue
    }

    const char = text[index]
    if (char === '{' || char === '[') {
      const end = matchingJsonEnd(text, index)
      if (end === -1) {
        result += text.slice(index)
        break
      }
      const parsed = tryParseJsonStructure(text.slice(index, end + 1))
      if (parsed !== null) {
        const needsBreak = result.length > 0 && !result.endsWith('\n')
        result += `${needsBreak ? '\n\n' : ''}${fencedJson(parsed)}\n`
        index = end + 1
        continue
      }
    }

    result += char
    index += 1
  }

  return result
}

/** Pretty-print JSON in a chat reply. Incomplete JSON stays as typed. */
export const formatChatResponseText = (text: string): string => {
  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  const whole = tryParseJsonStructure(trimmed)
  if (whole !== null) {
    return fencedJson(whole)
  }

  const fencedOnly = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(trimmed)
  if (fencedOnly?.[1]) {
    return prettyFenceBlock(trimmed)
  }

  return replaceTopLevelJson(text)
}

export const normalizeTimestampInput = (
  value: TimestampValue
): string | null => {
  if (value == null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value)
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (typeof value === 'object' && '$date' in value) {
    const dateValue = value.$date
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim()
      return trimmed || null
    }
  }

  return null
}

export const formatTimestamp = (timestamp: TimestampValue): string => {
  const normalized = normalizeTimestampInput(timestamp)
  if (!normalized) {
    return ''
  }

  try {
    const date = normalized.includes('T')
      ? new Date(normalized)
      : new Date(parseInt(normalized, 10))
    if (Number.isNaN(date.getTime())) {
      return normalized
    }
    return date.toLocaleString()
  } catch {
    return normalized
  }
}

export const formatDateObject = (dateObj: string): string => {
  try {
    return new Date(dateObj).toISOString()
  } catch {
    return dateObj
  }
}

export const normalizeDuration = (duration: number): number =>
  Math.max(0, duration)
