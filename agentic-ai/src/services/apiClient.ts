import { AppState } from '../types/common'

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
    return {
      'Content-Type': 'application/json',
      'Emporix-tenant': this.appState.tenant,
      Authorization: `Bearer ${this.appState.token}`,
      ...(extraHeaders || {}),
    }
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    // Ensure exactly one slash between base and path
    const base = this.baseUrl.replace(/\/$/, '')
    const suffix = path.startsWith('/') ? path : `/${path}`
    return `${base}${suffix}`
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const payload = isJson
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => undefined)

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`
      let disableable = false
      let force = false
      if (typeof payload === 'string' && payload) {
        message = payload
      } else if (payload && typeof payload === 'object') {
        const errorPayload = payload as any

        // Handle validation errors with details
        if (errorPayload.message) {
          message = errorPayload.message
        }
        if (
          errorPayload.details &&
          Array.isArray(errorPayload.details) &&
          errorPayload.details.length > 0
        ) {
          const validationMessages = errorPayload.details
            .filter((detail: any) => detail.type !== 'disableable' && detail.type !== 'force')
            .map((detail: any) => detail.message)
            .join('\n')
          if (validationMessages) {
            message += `\n${validationMessages}`
          }
          disableable = errorPayload.details.some(
            (detail: any) => detail.type === 'disableable'
          )
          force = errorPayload.details.some(
            (detail: any) => detail.type === 'force'
          )
        }

      }

      throw new ApiClientError(message, response.status, payload, disableable, force)
    }

    return payload as T as T
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

  async getWithHeaders<T>(path: string, init?: RequestInit): Promise<{ data: T, headers: Headers }> {
    const { headers: extraHeaders, ...restInit } = init || {};
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: this.buildHeaders(extraHeaders as Record<string, string> | undefined),
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
