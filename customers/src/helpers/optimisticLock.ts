import type { AxiosError } from 'axios'

/** Detect Emporix-style optimistic locking failures (HTTP + message). */
export function isOptimisticLockConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const ax = error as AxiosError<{ message?: string }>
  const status = ax.response?.status
  const msg =
    ax.response?.data?.message ?? (error as Error)?.message ?? ''
  if (status === 409 || status === 412) return true
  return /version.*outdated|outdated.*version|optimistic.*lock|stale.*version/i.test(
    String(msg)
  )
}
