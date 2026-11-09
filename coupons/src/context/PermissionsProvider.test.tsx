/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import {
  AccessControlsForEmployee,
  EmployeeDomains,
} from '../configs/accessControls'
import type { AccessControl } from '../models/Permissions.model'
import type { AppState } from '../models/AppState.model'
import { DashboardProvider } from './Dashboard.context'
import { PermissionsProvider, usePermissions } from './PermissionsProvider'

const iam = vi.hoisted(() => ({
  getAllAccessControlsForUser: vi.fn(),
  getAllAccessControls: vi.fn(),
  getAccessControlsTemplates: vi.fn(),
  getScopesForUser: vi.fn(),
}))

vi.mock('../hooks/api/iam', () => ({ useIamApi: () => iam }))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return {
    ...actual,
    useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
  }
})

const appState = (tenant: string): AppState => ({
  tenant,
  token: `token-${tenant}`,
  language: 'en',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

const ac = (id: string) => ({ id }) as AccessControl

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const Probe = () => {
  const { hasPermission } = usePermissions()
  return (
    <div data-testid="manager">
      {String(hasPermission(EmployeeDomains.STATUS_CODES_MANAGER))}
    </div>
  )
}

const tree = (tenant: string) => (
  <DashboardProvider appState={appState(tenant)}>
    <PermissionsProvider>
      <Probe />
    </PermissionsProvider>
  </DashboardProvider>
)

describe('PermissionsProvider', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('ignores a late access-control response for the previous tenant', async () => {
    const tenantA = deferred<AccessControl[]>()
    const tenantB = deferred<AccessControl[]>()
    iam.getAllAccessControlsForUser
      .mockReturnValueOnce(tenantA.promise)
      .mockReturnValueOnce(tenantB.promise)
    iam.getScopesForUser.mockResolvedValue({ scopes: '', vendorId: undefined })
    iam.getAccessControlsTemplates.mockResolvedValue([])
    iam.getAllAccessControls.mockResolvedValue({ values: [] })

    const { rerender } = render(tree('tenant-a'))
    rerender(tree('tenant-b'))

    // Tenant B (viewer only) answers first, then the stale tenant A (manager).
    await act(async () => {
      tenantB.resolve([ac(AccessControlsForEmployee.QUOTES_VIEWER)])
    })
    expect((await screen.findByTestId('manager')).textContent).toBe('false')

    await act(async () => {
      tenantA.resolve([ac(AccessControlsForEmployee.QUOTES_MANAGER)])
    })
    expect(screen.getByTestId('manager').textContent).toBe('false')
  })
})
