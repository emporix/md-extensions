import { createApiClient, createApiCredentials } from '@emporix/api-calls/next'
import { useLayoutEffect, useRef } from 'react'

/**
 * The tenant and token from the host's AppState, for this remote's own client.
 * The remote bundles its own copy of `@emporix/api-calls` (it is not in the
 * federation `shared` list), so its client never replaces the host's.
 */
export const credentials = createApiCredentials()
let isClientReady = false

const initApiClient = (): void => {
  if (isClientReady) return

  const baseURL = import.meta.env.VITE_API_URL
  if (typeof baseURL !== 'string' || !baseURL) {
    throw new Error('VITE_API_URL is not configured')
  }

  // One client for the root calls and the ./next calls.
  createApiClient({
    baseURL,
    getAccessToken: credentials.getAccessToken,
    getTenant: credentials.getTenant,
    // Fails the request with the 401 as before until the host passes a
    // `refreshToken` in AppState.
    onUnauthorized: credentials.onUnauthorized,
  })
  isClientReady = true
}

export const setApiCredentials = (tenant: string, token: string): void => {
  credentials.set({ tenant, token })
  initApiClient()
}

/**
 * Keeps the client in sync with the host credentials.
 * useLayoutEffect runs before child useEffect fetches while avoiding render-phase side effects.
 */
export const useApiCredentials = (tenant: string, token: string): void => {
  const previousRef = useRef({ tenant: '', token: '' })

  useLayoutEffect(() => {
    if (
      previousRef.current.tenant !== tenant ||
      previousRef.current.token !== token
    ) {
      previousRef.current = { tenant, token }
      setApiCredentials(tenant, token)
    }
  }, [tenant, token])
}
