import { AppState } from '../types/common'
import {
  AgentChatStreamEvent,
  mapAgentChatStreamEvent,
  readSseStream,
} from '../utils/sseHelpers'
import { MAX_ZIP_DOWNLOAD_BYTES } from '../utils/functionZipSource.helpers'

interface ErrorDetail {
  field: string
  type: string
  message: string
}

interface ErrorPayload {
  code: number
  type: string
  message: string
  details?: ErrorDetail[]
}

export class ApiClientError extends Error {
  status?: number
  body?: unknown
  disableable?: boolean
  force?: boolean

  constructor(
    message: string,
    status?: number,
    body?: unknown,
    disableable?: boolean,
    force?: boolean
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.body = body
    this.disableable = disableable
    this.force = force
  }
}

export class ApiClient {
  private baseUrl: string
  private appState: AppState

  constructor(appState: AppState) {
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://api.emporix.io'
    this.appState = appState
  }

  private buildHeaders(extraHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Emporix-tenant': this.appState.tenant,
      Authorization: `Bearer ${this.appState.token}`,
      ...(extraHeaders || {}),
    }

    headers['Content-Language'] = '*'
    headers['Accept-Language'] = '*'

    return headers
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    // Ensure exactly one slash between base and path
    const base = this.baseUrl.replace(/\/$/, '')
    const suffix = path.startsWith('/') ? path : `/${path}`
    return `${base}${suffix}`
  }

  private async readResponsePayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    return isJson
      ? response.json().catch(() => undefined)
      : response.text().catch(() => undefined)
  }

  private throwApiClientError(response: Response, payload: unknown): never {
    let message = `Request failed with status ${response.status}`
    let disableable = false
    let force = false

    if (typeof payload === 'string' && payload) {
      message = payload
    } else if (payload && typeof payload === 'object') {
      const errorPayload = payload as ErrorPayload

      if (errorPayload.message) {
        message = errorPayload.message
      }
      if (
        errorPayload.details &&
        Array.isArray(errorPayload.details) &&
        errorPayload.details.length > 0
      ) {
        const validationMessages = errorPayload.details
          .filter(
            (detail: ErrorDetail) =>
              detail.type !== 'disableable' && detail.type !== 'force'
          )
          .map((detail: ErrorDetail) => detail.message)
          .join('\n')
        if (validationMessages) {
          message += `\n${validationMessages}`
        }
        disableable = errorPayload.details.some(
          (detail: ErrorDetail) => detail.type === 'disableable'
        )
        force = errorPayload.details.some(
          (detail: ErrorDetail) => detail.type === 'force'
        )
      }
    }

    throw new ApiClientError(
      message,
      response.status,
      payload,
      disableable,
      force
    )
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const payload = await this.readResponsePayload(response)

    if (!response.ok) {
      this.throwApiClientError(response, payload)
    }

    return payload as T as T
  }

  /**
   * GET binary response (e.g. media download). Parses JSON/text only for error responses.
   */
  async getArrayBuffer(path: string, init?: RequestInit): Promise<ArrayBuffer> {
    const { headers: extraHeaders, ...restInit } = init || {}
    const headers = new Headers(
      this.buildHeaders(extraHeaders as Record<string, string> | undefined)
    )
    headers.delete('Content-Type')
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers,
      ...restInit,
    })
    if (!response.ok) {
      const payload = await this.readResponsePayload(response)
      this.throwApiClientError(response, payload)
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      const declaredSize = Number.parseInt(contentLength, 10)
      if (
        Number.isFinite(declaredSize) &&
        declaredSize > MAX_ZIP_DOWNLOAD_BYTES
      ) {
        throw new ApiClientError(
          `Response exceeds maximum size of ${MAX_ZIP_DOWNLOAD_BYTES} bytes`,
          response.status
        )
      }
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_ZIP_DOWNLOAD_BYTES) {
      throw new ApiClientError(
        `Response exceeds maximum size of ${MAX_ZIP_DOWNLOAD_BYTES} bytes`,
        response.status
      )
    }
    return buffer
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: this.buildHeaders(
        init?.headers as Record<string, string> | undefined
      ),
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async getWithHeaders<T>(
    path: string,
    init?: RequestInit
  ): Promise<{ data: T; headers: Headers }> {
    const { headers: extraHeaders, ...restInit } = init || {}
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: this.buildHeaders(
        extraHeaders as Record<string, string> | undefined
      ),
      ...restInit,
    })
    const data = await this.handleResponse<T>(response)
    return { data, headers: response.headers }
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.buildHeaders(
        init?.headers as Record<string, string> | undefined
      ),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async *postSse(
    path: string,
    body?: unknown,
    init?: RequestInit
  ): AsyncGenerator<AgentChatStreamEvent> {
    const { headers: extraHeaders, body: _, ...restInit } = init || {}
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.buildHeaders({
        Accept: 'text/event-stream',
        ...(extraHeaders as Record<string, string> | undefined),
      }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...restInit,
    })

    if (!response.ok) {
      const payload = await this.readResponsePayload(response)
      this.throwApiClientError(response, payload)
    }

    if (!response.body) {
      throw new ApiClientError('Empty stream response', response.status)
    }

    for await (const frame of readSseStream(response.body)) {
      const event = mapAgentChatStreamEvent(frame)
      if (event) {
        yield event
      }
    }
  }

  async put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'PUT',
      headers: this.buildHeaders(
        init?.headers as Record<string, string> | undefined
      ),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      headers: this.buildHeaders(
        init?.headers as Record<string, string> | undefined
      ),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async delete(path: string, init?: RequestInit): Promise<void> {
    const response = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      headers: this.buildHeaders(
        init?.headers as Record<string, string> | undefined
      ),
      ...init,
    })
    await this.handleResponse<void>(response)
  }
}
