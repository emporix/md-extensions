import { useCallback } from 'react'
import { useDashboardContext } from '../context/Dashboard.context'

/**
 * Tells the host that the tenant's sites changed, so the dashboard shell
 * (site switcher) reloads them. A host without the callback is ignored.
 */
export const useNotifySitesChanged = () => {
  const { onSitesChanged } = useDashboardContext()

  return useCallback(() => {
    onSitesChanged?.()
  }, [onSitesChanged])
}
