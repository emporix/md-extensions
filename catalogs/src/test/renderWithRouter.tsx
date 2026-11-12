import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

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
 * Renders the remote's hash routes in memory, starting at `path`.
 * `switchTenant` re-renders the same tree with another host tenant, the way
 * the host does without remounting the remote.
 */
export const renderAt = (
  path: string,
  routes: { list: ReactNode; detail: ReactNode },
  tenant = ''
) => {
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant)}>
      <MemoryRouter initialEntries={[path]}>
        <RefreshValuesProvider>
          <Routes>
            <Route path="/" element={routes.list} />
            <Route path="/add" element={routes.detail} />
            <Route path="/:id" element={routes.detail} />
          </Routes>
          <LocationDisplay />
        </RefreshValuesProvider>
      </MemoryRouter>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return {
    ...result,
    switchTenant: (nextTenant: string) => result.rerender(tree(nextTenant)),
  }
}
