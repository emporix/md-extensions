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

export const formatErrorPayloadMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    const normalized = stripSseDataPrefix(payload)
    if (!normalized.startsWith('{') && !normalized.startsWith('[')) {
      return payload.trim() || null
    }

    try {
      return formatErrorPayloadMessage(JSON.parse(normalized))
    } catch {
      return payload.trim() || null
    }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  const record = payload as ErrorPayloadLike
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
