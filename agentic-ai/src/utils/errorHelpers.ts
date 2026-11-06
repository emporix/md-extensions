import { ApiClientError } from '../services/apiClient'

type ErrorDetailLike = {
  readonly message?: unknown
  readonly type?: unknown
}

type ErrorPayloadLike = {
  readonly message?: unknown
  readonly status?: unknown
  readonly detail?: unknown
  readonly explanation?: unknown
  readonly error?: unknown
  readonly details?: unknown
}

const stripSseDataPrefix = (content: string): string => {
  const trimmed = content.trim()
  if (!trimmed) {
    return trimmed
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }

  const lines = trimmed.split(/\r?\n/)
  const dataLineIndex = lines.findIndex((line) =>
    line.trim().startsWith('data:')
  )

  if (dataLineIndex >= 0) {
    const firstLine = lines[dataLineIndex].trim()
    const jsonStart = firstLine.slice('data:'.length).trim()
    const remainingLines = lines.slice(dataLineIndex + 1).join('\n')

    return remainingLines ? `${jsonStart}\n${remainingLines}`.trim() : jsonStart
  }

  const jsonLineIndex = lines.findIndex((line) => {
    const lineTrimmed = line.trim()
    return lineTrimmed.startsWith('{') || lineTrimmed.startsWith('[')
  })

  if (jsonLineIndex >= 0) {
    return lines.slice(jsonLineIndex).join('\n').trim()
  }

  return trimmed
}

const MESSAGE_FIELD =
  /['"]message['"]\s*:\s*(['"])([\s\S]*?)\1(?=\s*,\s*['"](?:type|param|code|details|error|status)['"]|\s*})/g

const unescapeMessageLiteral = (value: string): string =>
  value.replace(/\\(['"\\nrt])/g, (_, ch: string) => {
    if (ch === 'n') {
      return '\n'
    }
    if (ch === 'r') {
      return '\r'
    }
    if (ch === 't') {
      return '\t'
    }
    return ch
  })

const extractEmbeddedMessages = (source: string): string[] => {
  const found: string[] = []
  for (const match of source.matchAll(MESSAGE_FIELD)) {
    const value = unescapeMessageLiteral(match[2] ?? '').trim()
    if (value) {
      found.push(value)
    }
  }
  return found
}

const collectDetailMessages = (details: unknown): string[] => {
  if (!Array.isArray(details)) {
    return []
  }

  return details
    .filter(
      (detail): detail is ErrorDetailLike =>
        !!detail && typeof detail === 'object'
    )
    .filter(
      (detail) => detail.type !== 'disableable' && detail.type !== 'force'
    )
    .map((detail) =>
      typeof detail.message === 'string' ? detail.message.trim() : ''
    )
    .filter(Boolean)
}

const messageFromUnknownJson = (source: string): string | null => {
  const jsonStart = source.indexOf('{')
  if (jsonStart < 0) {
    return null
  }

  try {
    return formatErrorPayloadMessage(JSON.parse(source.slice(jsonStart)))
  } catch {
    return null
  }
}

export const formatErrorPayloadMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    const normalized = stripSseDataPrefix(payload)
    if (normalized.startsWith('{') || normalized.startsWith('[')) {
      try {
        return formatErrorPayloadMessage(JSON.parse(normalized))
      } catch {
        const embedded = extractEmbeddedMessages(normalized)
        return embedded[embedded.length - 1] ?? (payload.trim() || null)
      }
    }

    const parsed = messageFromUnknownJson(normalized)
    if (parsed) {
      return parsed
    }

    const embedded = extractEmbeddedMessages(normalized)
    if (embedded.length > 0) {
      return embedded[embedded.length - 1] ?? null
    }

    return payload.trim() || null
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  const record = payload as ErrorPayloadLike
  if (
    record.error &&
    typeof record.error === 'object' &&
    !Array.isArray(record.error)
  ) {
    const nested = formatErrorPayloadMessage(record.error)
    if (nested) {
      return nested
    }
  }

  const primaryCandidates = [
    record.message,
    record.status,
    record.explanation,
    record.detail,
    record.error,
  ]

  let primary = ''
  for (const candidate of primaryCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      primary = candidate.trim()
      break
    }
  }

  const detailMessages = collectDetailMessages(record.details).filter(
    (detail) => detail !== primary
  )

  if (primary && detailMessages.length > 0) {
    return `${primary}: ${detailMessages.join('; ')}`
  }

  if (primary) {
    return primary
  }

  if (detailMessages.length > 0) {
    return detailMessages.join('; ')
  }

  return null
}

export const formatApiError = (
  err: unknown,
  fallbackMessage: string
): string => {
  if (err instanceof ApiClientError) {
    return (
      formatErrorPayloadMessage(err.message) || err.message || fallbackMessage
    )
  }
  if (err instanceof Error) {
    return (
      formatErrorPayloadMessage(err.message) || err.message || fallbackMessage
    )
  }
  return fallbackMessage
}

export const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') {
    return false
  }
  return (err as { name?: unknown }).name === 'AbortError'
}

const STREAM_ERROR_CODE_400 = /\berror code:\s*400\b/i

export const isChatBadRequest = (err: unknown): boolean => {
  if (err instanceof ApiClientError && err.status === 400) {
    return true
  }
  return err instanceof Error && STREAM_ERROR_CODE_400.test(err.message)
}

export const shouldFallbackToSyncChat = (
  err: unknown,
  sawStreamOutput: boolean
): boolean => !sawStreamOutput && !isAbortError(err) && isChatBadRequest(err)

type EntityLoadErrorKeys = {
  readonly notFoundKey: string
  readonly errorKey: string
}

export const getEntityLoadErrorMessage = (
  err: unknown,
  keys: EntityLoadErrorKeys,
  t: (key: string) => string
): string => {
  if (err instanceof ApiClientError && err.status === 404) {
    return t(keys.notFoundKey)
  }

  return t(keys.errorKey)
}
