import { ApiClientError } from '../services/apiClient'

export const formatApiError = (err: unknown, fallbackMessage: string): string => {
  if (err instanceof ApiClientError) {
    return err.message || fallbackMessage
  }
  if (err instanceof Error) {
    return err.message || fallbackMessage
  }
  return fallbackMessage
}


