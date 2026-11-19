/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { listChangelogsWithCursorCall } from '@emporix/api-calls/next'
import '../../translations/i18n'
import { DashboardProvider } from '../../context/Dashboard.context'
import type { AppState } from '../../models/AppState.model'
import EntityChangelogTab from './EntityChangelogTab'

vi.mock('@emporix/api-calls/next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/api-calls/next')>()),
  listChangelogsWithCursorCall: vi.fn(),
}))

const listCall = vi.mocked(listChangelogsWithCursorCall)

const appState: AppState = {
  tenant: 'acme',
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
}

const mount = (isActive = true) =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter>
        <EntityChangelogTab entity="group" entityId="c1" isActive={isActive} />
      </MemoryRouter>
    </DashboardProvider>
  )

const emptyPage = { values: [], nextCursor: null, prevCursor: null }

describe('EntityChangelogTab', () => {
  beforeEach(() => {
    listCall.mockReset().mockResolvedValue(emptyPage)
  })

  afterEach(cleanup)

  it('shows the translated empty text when there are no entries', async () => {
    mount()

    expect(
      await screen.findByText('No audit log entries in the selected period')
    ).toBeTruthy()
  })

  it('requests the entity history for the dashboard tenant', async () => {
    mount()

    await waitFor(() => expect(listCall).toHaveBeenCalledTimes(1))
    const [params, options] = listCall.mock.calls[0]
    expect(options).toEqual({ tenant: 'acme' })
    expect(params.q).toContain('group')
    expect(params.q).toContain('c1')
  })

  it("links a related group to this remote's detail path", async () => {
    listCall.mockResolvedValue({
      values: [
        {
          at: '2026-11-18T10:00:00.000Z',
          type: 'update',
          entity: 'group',
          entityId: 'c1',
          related: [
            { entity: 'group', entityId: 'c1' },
            { entity: 'group', entityId: 'c2' },
          ],
        },
      ],
      nextCursor: null,
      prevCursor: null,
    })
    mount()

    const link = await screen.findByRole('link')
    expect(link.getAttribute('href')).toBe('/groups/c2')
  })

  it('requests nothing while the tab is not active', async () => {
    mount(false)

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(listCall).not.toHaveBeenCalled()
  })
})
