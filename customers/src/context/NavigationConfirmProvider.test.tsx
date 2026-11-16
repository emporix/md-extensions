/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router'
import i18n from '../translations/i18n'
import {
  NavigationBlocker,
  NavigationConfirmProvider,
  useNavigationConfirm,
} from './NavigationConfirmProvider'

const Page = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setNavigationBlocked, releaseNavigation } = useNavigationConfirm()
  return (
    <>
      <div data-testid="location">{location.pathname + location.search}</div>
      <button onClick={() => setNavigationBlocked(true)}>edit</button>
      <button onClick={() => navigate('/other')}>leave</button>
      <button onClick={() => navigate('/form?tab=policies')}>tab</button>
      <button
        onClick={() => {
          releaseNavigation()
          navigate('/other')
        }}
      >
        save and leave
      </button>
    </>
  )
}

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <NavigationBlocker />
            <Outlet />
          </>
        ),
        children: [
          { path: '/form', element: <Page /> },
          { path: '/other', element: <Page /> },
        ],
      },
    ],
    { initialEntries: [path] }
  )
  render(
    <NavigationConfirmProvider>
      <RouterProvider router={router} />
    </NavigationConfirmProvider>
  )
}

const location = () => screen.getByTestId('location').textContent
const click = (name: string) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))
const dialog = () => screen.queryByRole('dialog')

describe('NavigationBlocker', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    cleanup()
  })

  it('lets a clean page navigate', () => {
    renderAt('/form')
    click('leave')
    expect(location()).toBe('/other')
    expect(dialog()).toBeNull()
  })

  it('asks before leaving unsaved changes; reject stays, accept leaves', () => {
    renderAt('/form')
    click('edit')

    click('leave')
    expect(location()).toBe('/form')
    const box = dialog()
    expect(box).not.toBeNull()
    act(() =>
      fireEvent.click(
        within(box as HTMLElement).getByRole('button', { name: 'Cancel' })
      )
    )
    expect(location()).toBe('/form')

    click('leave')
    act(() =>
      fireEvent.click(
        within(dialog() as HTMLElement).getByRole('button', { name: 'Yes' })
      )
    )
    expect(location()).toBe('/other')
  })

  it('keeps the edits on a tab (query-only) change without asking', () => {
    renderAt('/form')
    click('edit')
    click('tab')
    expect(location()).toBe('/form?tab=policies')
    expect(dialog()).toBeNull()
  })

  it('lets a navigation right after releaseNavigation through (save)', () => {
    renderAt('/form')
    click('edit')
    click('save and leave')
    expect(location()).toBe('/other')
    expect(dialog()).toBeNull()
  })
})
