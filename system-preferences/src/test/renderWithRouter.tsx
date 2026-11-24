import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

/**
 * Renders the remote's page on its hash route in memory. `switchTenant`
 * re-renders the same tree with another host tenant, the way the host does
 * without remounting the remote.
 */
export const renderPage = (page: ReactNode, tenant = 'tenant-a') => {
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant)}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={page} />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return {
    ...result,
    switchTenant: (nextTenant: string) => result.rerender(tree(nextTenant)),
  }
}
