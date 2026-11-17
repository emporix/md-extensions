import axios, { type AxiosRequestConfig } from 'axios'
import { setApiClient } from '@emporix/api-calls/next'

export interface StubbedRequest {
  method: string
  url: string
  params: Record<string, unknown>
  data: unknown
  headers: Record<string, unknown>
  responseType?: string
}

export interface StubbedResponse {
  data?: unknown
  headers?: Record<string, string>
}

/**
 * Registers an `@emporix/api-calls` client that answers every request with
 * `respond` instead of sending it, and returns the requests it got. The real
 * calls build the requests, so a test sees what the API would receive.
 */
export const stubApiClient = (
  respond: (config: AxiosRequestConfig) => StubbedResponse = () => ({})
): StubbedRequest[] => {
  const requests: StubbedRequest[] = []
  setApiClient(
    axios.create({
      adapter: async (config) => {
        requests.push({
          method: (config.method ?? 'get').toUpperCase(),
          url: config.url ?? '',
          params: { ...config.params },
          data:
            typeof config.data === 'string'
              ? JSON.parse(config.data)
              : config.data,
          headers: { ...config.headers?.toJSON() },
          responseType: config.responseType,
        })
        const { data = null, headers = {} } = respond(config)
        return { data, status: 200, statusText: 'OK', headers, config }
      },
    })
  )
  return requests
}
