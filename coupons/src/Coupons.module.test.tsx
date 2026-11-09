/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from './translations/i18n'
import { EmployeeDomains } from './configs/accessControls'
import CouponsModule from './Coupons.module'

const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('./context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

const renderModule = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<CouponsModule />}>
          <Route index element={<div>coupons list</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('Coupons module access', () => {
  afterEach(() => cleanup())

  it('renders the coupon screens for Coupons Viewer', async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.COUPONS_VIEWER]
    renderModule()

    expect(screen.getByText('coupons list')).toBeTruthy()
    expect(screen.queryByText('No permissions')).toBeNull()
  })

  it('renders no coupon screen without Coupons Viewer', async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.CUSTOMERS_VIEWER]
    renderModule()

    expect(screen.queryByText('coupons list')).toBeNull()
    expect(screen.getByText('No permissions')).toBeTruthy()
  })
})
