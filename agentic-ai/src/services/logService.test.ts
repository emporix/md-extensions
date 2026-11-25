import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'

const { mockGetWithHeaders } = vi.hoisted(() => ({
  mockGetWithHeaders: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    getWithHeaders = mockGetWithHeaders
  },
}))

import { LogService } from './logService'

const appState: AppState = {
  tenant: 'testtenant',
  token: 'token',
  language: 'en',
  contentLanguage: 'en',
}

const base = '/ai-service/testtenant/agentic/logs/requests'

describe('LogService', () => {
  let service: LogService

  beforeEach(() => {
    mockGetWithHeaders.mockReset()
    service = new LogService(appState)
  })

  describe('getRequestLogs', () => {
    it('asks the list endpoint for ids only and returns the first item', async () => {
      mockGetWithHeaders.mockResolvedValue({
        data: [{ id: 'log-1' }, { id: 'log-2' }],
      })

      const result = await service.getRequestLogs('req 1/a')

      expect(mockGetWithHeaders).toHaveBeenCalledTimes(1)
      expect(mockGetWithHeaders).toHaveBeenCalledWith(
        `${base}?q=requestId:req%201%2Fa&fields=id`,
        expect.anything()
      )
      expect(result).toEqual({ id: 'log-1' })
    })

    it('returns null when the list is empty', async () => {
      mockGetWithHeaders.mockResolvedValue({ data: [] })

      expect(await service.getRequestLogs('req-1')).toBeNull()
    })
  })

  describe('getAgentLogsByRequestId', () => {
    it('looks up the id in the list, then returns the detail with messages', async () => {
      const detail = {
        id: 'log-1',
        messages: [{ severity: 'INFO', message: 'hello' }],
      }
      mockGetWithHeaders
        .mockResolvedValueOnce({ data: [{ id: 'log-1' }] })
        .mockResolvedValueOnce({ data: detail })

      const result = await service.getAgentLogsByRequestId('req-1')

      expect(mockGetWithHeaders).toHaveBeenCalledTimes(2)
      expect(mockGetWithHeaders).toHaveBeenNthCalledWith(
        1,
        `${base}?q=requestId:req-1&fields=id`,
        expect.anything()
      )
      expect(mockGetWithHeaders).toHaveBeenNthCalledWith(
        2,
        `${base}/log-1`,
        expect.anything()
      )
      expect(result).toEqual(detail)
    })

    it('returns null and skips the detail call when the list is empty', async () => {
      mockGetWithHeaders.mockResolvedValue({ data: [] })

      const result = await service.getAgentLogsByRequestId('req-1')

      expect(result).toBeNull()
      expect(mockGetWithHeaders).toHaveBeenCalledTimes(1)
    })
  })
})
