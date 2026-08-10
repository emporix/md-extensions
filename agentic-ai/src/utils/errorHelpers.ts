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
  const dataLine = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('data:') || line.startsWith('{'))

  if (!dataLine) {
    return trimmed
  }

  return dataLine.startsWith('data:')
    ? dataLine.slice('data:'.length).trim()
    : dataLine
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
