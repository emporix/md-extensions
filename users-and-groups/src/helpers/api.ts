import { Dispatch, SetStateAction } from 'react'

export const getApiErrorDetails = (error: unknown): string | undefined => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object'
  ) {
    const data = error.response.data as {
      details?: unknown
      message?: unknown
    }
    if (data.details !== undefined) return String(data.details)
    if (data.message !== undefined) return String(data.message)
  }
  return undefined
}

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status
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
