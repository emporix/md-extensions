import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

/** Renders the remote's hash routes in memory, starting at `path`. */
export const renderAt = (
  path: string,
  routes: { list: ReactNode; detail: ReactNode }
) =>
  render(
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
  )
