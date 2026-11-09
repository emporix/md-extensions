/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardProvider } from './Dashboard.context'
import {
  ReferenceOptionsProvider,
  useReferenceOptions,
} from './ReferenceOptionsProvider'
import type { AppState } from '../models/AppState.model'

const api = vi.hoisted(() => ({ getAllCustomEntities: vi.fn() }))
vi.mock('../hooks/api/customEntities', () => ({
  useCustomEntitiesApi: () => api,
}))

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

const Probe = () => {
  const { customEntities } = useReferenceOptions()
  return (
    <div data-testid="entities">
      {customEntities.map((entity) => entity.id).join(',')}
    </div>
  )
}

const tree = (tenant: string) => (
  <DashboardProvider appState={appStateFor(tenant)}>
    <ReferenceOptionsProvider>
      <Probe />
    </ReferenceOptionsProvider>
  </DashboardProvider>
)

const entities = () => screen.getByTestId('entities').textContent

describe('ReferenceOptionsProvider', () => {
  afterEach(() => {
    cleanup()
    api.getAllCustomEntities.mockReset()
  })

  it('drops the previous tenant entities and ignores its late response', async () => {
    let resolveTenantA: (value: unknown) => void = () => undefined
    api.getAllCustomEntities
      .mockResolvedValueOnce([{ id: 'A-1' }])
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveTenantA = resolve))
      )
      .mockResolvedValueOnce([{ id: 'B-1' }])

    const { rerender } = render(tree('tenant-a'))
    await waitFor(() => expect(entities()).toBe('A-1'))

    // Reload for tenant A is still pending when the host switches to B.
    rerender(tree('tenant-a2'))
    expect(entities()).toBe('')
    rerender(tree('tenant-b'))
    await waitFor(() => expect(entities()).toBe('B-1'))

    await act(async () => {
      resolveTenantA([{ id: 'A-late' }])
    })
    expect(entities()).toBe('B-1')
  })
})
