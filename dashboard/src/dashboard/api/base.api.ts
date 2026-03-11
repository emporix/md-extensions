const DEFAULT_TIMEOUT_MS = 30_000

type HeaderOptions = {
  tenant: string
  token: string
  accept?: string
  includeTotalCount?: boolean
  contentType?: string
}

export const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL
  if (!url || typeof url !== 'string') return ''
  return url.replace(/\/$/, '')
}

export const getTimeoutMs = (): number => {
  const raw = import.meta.env.VITE_API_TIMEOUT
  if (!raw) return DEFAULT_TIMEOUT_MS
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_TIMEOUT_MS : parsed
}

export const buildHeaders = ({
  tenant,
  token,
  accept = 'application/json, text/plain, */*',
  includeTotalCount = false,
  contentType,
}: HeaderOptions): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: accept,
    Authorization: `Bearer ${token}`,
    'Emporix-Tenant': tenant,
  }

  if (includeTotalCount) {
    headers['X-Total-Count'] = 'true'
  }

  if (contentType) {
    headers['Content-Type'] = contentType
  }

  return headers
}

const DEFAULT_RETRY_COUNT = 2
const RETRY_DELAY_MS = 500

const isRetryableMethod = (init: RequestInit): boolean => {
  const method = (init.method ?? 'GET').toUpperCase()
  return method === 'GET' || method === 'HEAD'
}

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (error instanceof TypeError) return true
  return false
}

const isRetryableStatus = (status: number): boolean =>
  status === 429 || status === 502 || status === 503 || status === 504

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const apiFetch = async (
  url: string,
  init: RequestInit = {},
  retries: number = DEFAULT_RETRY_COUNT
): Promise<Response> => {
  const shouldRetry = isRetryableMethod(init) && retries > 0
  let lastError: unknown

  const maxAttempts = shouldRetry ? retries + 1 : 1

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const timeoutMs = getTimeoutMs()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timeoutId)

      if (
        shouldRetry &&
        attempt < maxAttempts - 1 &&
        isRetryableStatus(response.status)
      ) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`)
      }

      if (shouldRetry && attempt < maxAttempts - 1 && isRetryableError(error)) {
        lastError = error
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      throw error
    }
  }

  throw lastError
}

export const parseCollectionResponse = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (!data || typeof data !== 'object') return []

  const payload = data as Record<string, unknown>
  const list = payload.content ?? payload.data ?? payload.items
  return Array.isArray(list) ? (list as T[]) : []
}

export const extractTotalCount = (
  res: Response,
  data?: unknown
): number | null => {
  const rawTotal =
    res.headers.get('X-Total-Count') ?? res.headers.get('x-total-count')
  if (rawTotal !== null && rawTotal !== '') {
    const parsed = parseInt(rawTotal, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (!data || typeof data !== 'object') return null
  const payload = data as Record<string, unknown>
  const value = payload.totalElements ?? payload.total
  return typeof value === 'number' && !Number.isNaN(value) ? value : null
}

const ERROR_MESSAGES: Record<number, string> = {
  401: 'Unauthorized',
  403: 'Access denied',
  404: 'Resource not found',
  429: 'Too many requests — please try again later',
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const toApiError = (res: Response, operation: string): ApiError => {
  const specific = ERROR_MESSAGES[res.status]
  const message = specific ?? `Failed to ${operation} (${res.status})`
  return new ApiError(res.status, message)
}

export const ensureApiContext = (
  baseUrl: string,
  tenant: string,
  token: string
): void => {
  if (!baseUrl || !tenant || !token) {
    throw new Error('Missing API base URL, tenant, or token')
  }
}

export const normalizeISOStart = (dateStr: string): string =>
  dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00.000Z`

export const normalizeISOEnd = (dateStr: string): string =>
  dateStr.includes('T') ? dateStr : `${dateStr}T23:59:59.999Z`

export const buildRestrictionQuery = (siteCode: string): string =>
  `restriction:${siteCode}`

export type PaginationOptions = {
  pageNumber?: number
  pageSize?: number
  sort?: string
  fields?: string
}

export const buildPaginationParams = ({
  pageNumber = 1,
  pageSize = 50,
  sort,
  fields,
}: PaginationOptions): URLSearchParams => {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  if (sort) params.set('sort', sort)
  if (fields) params.set('fields', fields)
  return params
}
