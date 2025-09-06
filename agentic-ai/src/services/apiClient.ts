import { AppState } from '../types/common'

export class ApiClientError extends Error {
  status?: number
  body?: unknown

  constructor(message: string, status?: number, body?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.body = body
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
      'Authorization': `Bearer ${this.appState.token}`,
      ...(extraHeaders || {})
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
    const payload = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined)

    if (!response.ok) {
      const message = typeof payload === 'string' && payload ? payload : (payload && (payload as any).message) || `Request failed with status ${response.status}`
      throw new ApiClientError(message, response.status, payload)
    }

    return (payload as T) as T
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: this.buildHeaders(init?.headers as Record<string, string> | undefined),
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.buildHeaders(init?.headers as Record<string, string> | undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'PUT',
      headers: this.buildHeaders(init?.headers as Record<string, string> | undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      headers: this.buildHeaders(init?.headers as Record<string, string> | undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
    return this.handleResponse<T>(response)
  }

  async delete(path: string, init?: RequestInit): Promise<void> {
    const response = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      headers: this.buildHeaders(init?.headers as Record<string, string> | undefined),
      ...init,
    })
    await this.handleResponse<void>(response)
  }
}


