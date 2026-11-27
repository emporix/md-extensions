import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import {
  HashRouter,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="search">{location.search}</div>
    </>
  )
}

const appStateFor = (tenant: string, contentLanguage: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage,
  onError: () => {
    // NOOP
  },
})

/**
 * Renders the remote's hash routes in memory, starting at `path`.
 * `switchTenant` re-renders the same tree with another host tenant, the way
 * the host does without remounting the remote. `hashRouter` uses the real
 * `HashRouter` (as `RemoteComponent` does) for code that reads the live
 * `window.location.hash`, e.g. the pagination URL sync. `contentLanguage` is
 * the host's content language, as the host configuration spells it.
 */
export const renderAt = (
  path: string,
  routes: { list: ReactNode; detail: ReactNode },
  tenant = '',
  {
    hashRouter = false,
    contentLanguage = 'en',
  }: { hashRouter?: boolean; contentLanguage?: string } = {}
) => {
  if (hashRouter) window.location.hash = `#${path}`
  const Router = ({ children }: { children: ReactNode }) =>
    hashRouter ? (
      <HashRouter>{children}</HashRouter>
    ) : (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    )
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant, contentLanguage)}>
      <Router>
        <RefreshValuesProvider>
          <Routes>
            <Route path="/" element={routes.list} />
            <Route path="/add" element={routes.detail} />
            <Route path="/:categoryId" element={routes.detail} />
          </Routes>
          <LocationDisplay />
        </RefreshValuesProvider>
      </Router>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return {
    ...result,
    switchTenant: (nextTenant: string) => result.rerender(tree(nextTenant)),
  }
}
