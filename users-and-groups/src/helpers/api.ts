import { Dispatch, SetStateAction } from 'react'

/**
 * IAM ErrorResponse: `{ code, status: string, message, details?: string[], resourceId? }`
 * Platform validation errors: `details` may be `{ field?, type, message? }[]`
 */
type ApiErrorBody = {
  readonly resourceId?: string | null
  readonly code?: number | string
  readonly status?: number | string
  readonly message?: unknown
  readonly details?: unknown
  readonly type?: unknown
}

const getApiErrorBody = (error: unknown): ApiErrorBody | undefined => {
  if (
    !error ||
    typeof error !== 'object' ||
    !('response' in error) ||
    !error.response ||
    typeof error.response !== 'object' ||
    !('data' in error.response) ||
    !error.response.data ||
    typeof error.response.data !== 'object'
  ) {
    return undefined
  }
  return error.response.data as ApiErrorBody
}

const formatDetailItem = (item: unknown): string | undefined => {
  if (item === undefined || item === null) {
    return undefined
  }
  if (typeof item === 'string') {
    const trimmed = item.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof item === 'object' && 'message' in item) {
    return formatDetailItem((item as { message: unknown }).message)
  }
  return undefined
}

const formatApiErrorDetailsList = (details: unknown): string[] => {
  if (details === undefined || details === null) {
    return []
  }
  if (Array.isArray(details)) {
    return details
      .map((item) => formatDetailItem(item))
      .filter((item): item is string => item !== undefined)
  }
  const single = formatDetailItem(details)
  return single ? [single] : []
}

const formatApiErrorField = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  if (Array.isArray(value)) {
    const parts = formatApiErrorDetailsList(value)
    return parts.length > 0 ? parts.join(', ') : undefined
  }
  return formatDetailItem(value)
}

const toToastDetail = (items: string[]): string | string[] | undefined => {
  if (items.length === 0) {
    return undefined
  }
  if (items.length === 1) {
    return items[0]
  }
  return items
}

export const getApiErrorMessage = (error: unknown): string | undefined => {
  return formatApiErrorField(getApiErrorBody(error)?.message)
}

/** `details` field only — does not fall back to `message`. */
export const getApiErrorDetailsField = (
  error: unknown
): string | undefined => {
  return formatApiErrorField(getApiErrorBody(error)?.details)
}

export const getApiErrorDetailsList = (error: unknown): string[] => {
  return formatApiErrorDetailsList(getApiErrorBody(error)?.details)
}

export const getApiErrorDetails = (error: unknown): string | undefined => {
  const data = getApiErrorBody(error)
  if (!data) {
    return undefined
  }
  return (
    formatApiErrorField(data.details) ?? formatApiErrorField(data.message)
  )
}

export const getApiErrorResourceId = (error: unknown): string | undefined => {
  const resourceId = getApiErrorBody(error)?.resourceId
  if (typeof resourceId !== 'string') {
    return undefined
  }
  const trimmed = resourceId.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export type ApiErrorToastContent = {
  readonly title: string
  readonly detail?: string | string[]
}

/**
 * Prefer IAM/server `message` as title and `details` as body.
 * Falls back to a single local title when the response has neither.
 */
export const getConflictErrorToast = (
  error: unknown,
  fallbackTitle: string
): ApiErrorToastContent => {
  const message = getApiErrorMessage(error)
  const detail = toToastDetail(getApiErrorDetailsList(error))

  if (message && detail !== undefined) {
    return { title: message, detail }
  }
  if (detail !== undefined) {
    if (typeof detail === 'string') {
      return { title: detail }
    }
    const [first, ...rest] = detail
    return rest.length > 0
      ? { title: first ?? fallbackTitle, detail: rest }
      : { title: first ?? fallbackTitle }
  }
  if (message) {
    return { title: message }
  }
  return { title: fallbackTitle }
}

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    if ('status' in error.response) {
      const httpStatus = Number(error.response.status)
      if (Number.isFinite(httpStatus)) {
        return httpStatus
      }
    }

    if (
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object'
    ) {
      const body = error.response.data as ApiErrorBody
      // IAM uses string status ("Conflict"); prefer numeric `code` from the body.
      const bodyCode = Number(body.code)
      if (Number.isFinite(bodyCode)) {
        return bodyCode
      }
      const bodyStatus = Number(body.status)
      if (Number.isFinite(bodyStatus)) {
        return bodyStatus
      }
    }
  }
  return undefined
}

export const makeCall = async <T>(
  fn: () => Promise<T>,
  setIsLoading: Dispatch<SetStateAction<boolean>> | ((val: boolean) => void)
): Promise<T> => {
  try {
    setIsLoading(true)
    return await fn()
  } finally {
    setIsLoading(false)
  }
}

export const mapParamsToQ = (params: Record<string, unknown>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${key}:${value}`)
    .join(' ')
}
