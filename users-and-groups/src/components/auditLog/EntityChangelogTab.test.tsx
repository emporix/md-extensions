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

const mount = (entity: string, isActive = true) =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter>
        <EntityChangelogTab entity={entity} entityId="e1" isActive={isActive} />
      </MemoryRouter>
    </DashboardProvider>
  )

const emptyPage = { values: [], nextCursor: null, prevCursor: null }

const ENTITIES = [
  ['employee', '/users/e2'],
  ['group', '/groups/e2'],
] as const

describe('EntityChangelogTab', () => {
  beforeEach(() => {
    listCall.mockReset().mockResolvedValue(emptyPage)
  })

  afterEach(cleanup)

  it('shows the translated empty text when there are no entries', async () => {
    mount('employee')

    expect(
      await screen.findByText('No audit log entries in the selected period')
    ).toBeTruthy()
  })

  it.each(ENTITIES)(
    'requests the %s history for the dashboard tenant',
    async (entity) => {
      mount(entity)

      await waitFor(() => expect(listCall).toHaveBeenCalledTimes(1))
      const [params, options] = listCall.mock.calls[0]
      expect(options).toEqual({ tenant: 'acme' })
      expect(params.q).toContain(entity)
      expect(params.q).toContain('e1')
    }
  )

  it.each(ENTITIES)(
    "links a related %s to this remote's detail path",
    async (entity, href) => {
      listCall.mockResolvedValue({
        values: [
          {
            at: '2026-11-18T10:00:00.000Z',
            type: 'update',
            entity,
            entityId: 'e1',
            related: [
              { entity, entityId: 'e1' },
              { entity, entityId: 'e2' },
            ],
          },
        ],
        nextCursor: null,
        prevCursor: null,
      })
      mount(entity)

      const link = await screen.findByRole('link')

      // The rows-per-page control is named from this remote's translations

      expect(
        screen.getByRole('combobox', { name: 'Rows per page' })
      ).toBeTruthy()
      expect(link.getAttribute('href')).toBe(href)
    }
  )

  it('requests nothing while the tab is not active', async () => {
    mount('employee', false)

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(listCall).not.toHaveBeenCalled()
  })
})
