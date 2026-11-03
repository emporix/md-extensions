/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Configuration } from '../models/Configuration.model'
import {
  ConfigurationProvider,
  useConfiguration,
} from './ConfigurationProvider'

const mocks = vi.hoisted(() => ({
  fetchBasicConfiguration: vi.fn(),
  tenant: 'tenant-a',
}))

vi.mock('@emporix/api-calls', () => ({
  fetchBasicConfiguration: mocks.fetchBasicConfiguration,
  updateSingleConfiguration: vi.fn(),
}))
vi.mock('./Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: mocks.tenant, contentLanguage: 'en' }),
}))

const configWithTables = (count: number) =>
  ({
    tableConfigurations: Array.from({ length: count }, (_, index) => ({
      key: `table-${index}`,
      columns: [],
      mixins: [],
    })),
  }) as unknown as Configuration

const deferred = () => {
  let resolve: (value: Configuration) => void = () => undefined
  const promise = new Promise<Configuration>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const Probe = () => {
  const { isConfigurationLoaded, tableConfigurations } = useConfiguration()
  return (
    <span data-testid="state">
      {`${isConfigurationLoaded}:${tableConfigurations.length}`}
    </span>
  )
}

const tree = () => (
  <ConfigurationProvider>
    <Probe />
  </ConfigurationProvider>
)

const state = () => screen.getByTestId('state').textContent

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  mocks.tenant = 'tenant-a'
})

describe('ConfigurationProvider', () => {
  it('is loaded once the configuration of the tenant arrives', async () => {
    const answer = deferred()
    mocks.fetchBasicConfiguration.mockReturnValue(answer.promise)
    render(tree())
    expect(state()).toBe('false:0')

    await act(async () => answer.resolve(configWithTables(1)))

    expect(state()).toBe('true:1')
  })

  it('waits again for a new tenant and ignores a late answer for the old one', async () => {
    const forA = deferred()
    const forB = deferred()
    mocks.fetchBasicConfiguration
      .mockReturnValueOnce(forA.promise)
      .mockReturnValueOnce(forB.promise)
    const { rerender } = render(tree())

    mocks.tenant = 'tenant-b'
    rerender(tree())
    expect(mocks.fetchBasicConfiguration).toHaveBeenLastCalledWith('tenant-b')
    expect(state()).toBe('false:0')

    await act(async () => forB.resolve(configWithTables(2)))
    expect(state()).toBe('true:2')

    await act(async () => forA.resolve(configWithTables(1)))
    expect(state()).toBe('true:2')
  })

  it('counts a failed request as loaded', async () => {
    mocks.fetchBasicConfiguration.mockRejectedValue(new Error('offline'))
    render(tree())

    await act(async () => {
      await Promise.resolve()
    })

    expect(state()).toBe('true:0')
  })
})
