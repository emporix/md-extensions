/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EmployeeDomains } from '../../configs/accessControls'
import { AddNewContactButton } from './AddNewContactButton'

const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

const renderButton = (managerPermissions?: boolean) => {
  const handlers = { addNew: vi.fn(), addExisting: vi.fn() }
  render(
    <AddNewContactButton
      managerPermissions={managerPermissions}
      addNewContactLabel="Add new"
      addExistingContactLabel="Add existing"
      addNewContactHandle={handlers.addNew}
      addExistingContactHandle={handlers.addExisting}
    />
  )
  return handlers
}

describe('AddNewContactButton', () => {
  afterEach(() => {
    cleanup()
    permissions.granted = []
  })

  it('offers "add new" in a split button for a customers manager', async () => {
    permissions.granted = [EmployeeDomains.CUSTOMERS_MANAGER]
    const handlers = renderButton()

    expect(screen.getByTestId('add-contact-split-button')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add existing' }))
    expect(handlers.addExisting).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('add-contact-split-button-menubutton'))
    fireEvent.click(await screen.findByText('Add new'))
    expect(handlers.addNew).toHaveBeenCalledTimes(1)
  })

  it('shows only the "add existing" button without customers manager', () => {
    const handlers = renderButton()

    expect(screen.queryByTestId('add-contact-split-button')).toBeNull()
    expect(screen.queryByText('Add new')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add existing' }))
    expect(handlers.addExisting).toHaveBeenCalledTimes(1)
  })

  it('is disabled without manager permissions', () => {
    renderButton(false)

    expect(
      (
        screen.getByRole('button', {
          name: 'Add existing',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })
})
