/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import {
  createConfigurationsCall,
  deleteConfigurationCall,
  getConfigurationCall,
} from '@emporix/api-calls/next'
import { upsertConfiguration } from '@emporix/api-calls/platform'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderPage } from '../test/renderWithRouter'
import SystemPreferencesPage from './SystemPreferences.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls/next', () => ({
  getConfigurationCall: vi.fn(),
  createConfigurationsCall: vi.fn(),
  deleteConfigurationCall: vi.fn(),
}))

vi.mock('@emporix/api-calls/platform', () => ({
  upsertConfiguration: vi.fn(),
}))

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const TENANT = 'tenant-a'

/** What the tenant has stored; every other key answers 404. */
let stored: Record<string, unknown> = {}

const notFound = () =>
  Object.assign(new Error('Not found'), { response: { status: 404 } })

const value = (key: string) =>
  screen.getByTestId(`system-preferences-value-${key}`)

const rowOf = (key: string) => {
  const row = value(key).closest('tr')
  if (!row) throw new Error(`no row for ${key}`)
  return row as HTMLElement
}

const editorInput = (key: string) => {
  const editor = screen.getByTestId(`system-preferences-editor-${key}`)
  const input =
    editor.tagName === 'INPUT' ? editor : editor.querySelector('input')
  if (!input) throw new Error(`no editor input for ${key}`)
  return input as HTMLInputElement
}

/** The table pages by 10 rows; filter on the key to bring a later row onto page one. */
const showRow = async (key: string) => {
  const filters = document.querySelectorAll<HTMLInputElement>('thead input')
  fireEvent.input(filters[1], { target: { value: key } })
  await screen.findByTestId(`system-preferences-value-${key}`)
}

const startEditing = async (key: string) => {
  await showRow(key)
  fireEvent.click(await screen.findByTestId(`system-preferences-edit-${key}`))
  return screen.findByTestId(`system-preferences-editor-${key}`)
}

const save = (key: string) =>
  fireEvent.click(screen.getByTestId(`system-preferences-save-${key}`))

const renderLoaded = async () => {
  const result = renderPage(<SystemPreferencesPage />, TENANT)
  await waitFor(() =>
    expect(value('maxNumberOfCouponsPerCart').textContent).toBe('7')
  )
  return result
}

describe('System Preferences', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.SYSTEM_PREFERENCES_VIEWER,
      EmployeeDomains.SYSTEM_PREFERENCES_MANAGER,
    ]
    stored = {
      openAiApiToken: 'stored-secret',
      maxNumberOfCouponsPerCart: 7,
      couponPermanentDelete: true,
      webhookNotificationEmails: ['ops@example.com', 'it@example.com'],
    }
    vi.mocked(getConfigurationCall).mockImplementation(async (key) => {
      if (!(key in stored)) throw notFound()
      return { key, value: stored[key] }
    })
    vi.mocked(createConfigurationsCall).mockResolvedValue([])
    vi.mocked(upsertConfiguration).mockResolvedValue({ key: '', value: '' })
    vi.mocked(deleteConfigurationCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('shows each preference with its name, key and stored value', async () => {
      await renderLoaded()

      const row = rowOf('maxNumberOfCouponsPerCart')
      expect(
        within(row).getByText('Maximum number of coupons per cart')
      ).toBeTruthy()
      expect(within(row).getByText('maxNumberOfCouponsPerCart')).toBeTruthy()
      await showRow('webhookNotificationEmails')
      expect(value('webhookNotificationEmails').textContent).toBe(
        'ops@example.com, it@example.com'
      )
      await showRow('couponPermanentDelete')
      expect(
        (
          value('couponPermanentDelete').querySelector('input') ??
          (value('couponPermanentDelete') as HTMLInputElement)
        ).checked
      ).toBe(true)
      expect(getConfigurationCall).toHaveBeenCalledTimes(32)
      expect(getConfigurationCall).toHaveBeenCalledWith('openAiApiToken', {
        tenant: TENANT,
      })
    })

    it('shows the default of a preference the tenant has not set, and nothing without one', async () => {
      await renderLoaded()

      expect(value('customer.passwordreset.redirecturl').textContent).toBe('')
      await showRow('webhookFailureThreshold')
      expect(value('webhookFailureThreshold').textContent).toBe('100')
      await showRow('companyContactPropagation')
      expect(value('companyContactPropagation').textContent).toBe('UPWARD')
      expect(toast.showError).not.toHaveBeenCalled()
    })

    it('masks a stored secret and never shows its value', async () => {
      await renderLoaded()

      expect(value('openAiApiToken').textContent).toBe('********')
      expect(screen.queryByText('stored-secret')).toBeNull()
    })

    it('shows an info tooltip only for preferences with a description', async () => {
      await renderLoaded()

      expect(
        screen.queryByTestId(
          'system-preferences-info-maxNumberOfCouponsPerCart'
        )
      ).toBeNull()
      await showRow('webhookFailureThreshold')
      expect(
        screen.getByTestId('system-preferences-info-webhookFailureThreshold')
      ).toBeTruthy()
    })

    it('loads the preferences of the new tenant after a host tenant switch', async () => {
      const { switchTenant } = await renderLoaded()

      stored = { maxNumberOfCouponsPerCart: 2 }
      switchTenant('tenant-b')

      await waitFor(() =>
        expect(value('maxNumberOfCouponsPerCart').textContent).toBe('2')
      )
      expect(getConfigurationCall).toHaveBeenCalledWith(
        'maxNumberOfCouponsPerCart',
        { tenant: 'tenant-b' }
      )
      expect(value('openAiApiToken').textContent).toBe('')
    })
  })

  describe('filter', () => {
    it('keeps only the rows whose key contains the typed text', async () => {
      const { container } = await renderLoaded()

      const filters =
        container.querySelectorAll<HTMLInputElement>('thead input')
      fireEvent.input(filters[1], { target: { value: 'webhook' } })

      await waitFor(() =>
        expect(
          screen.queryByTestId(
            'system-preferences-value-maxNumberOfCouponsPerCart'
          )
        ).toBeNull()
      )
      expect(value('webhookFailureThreshold')).toBeTruthy()
      expect(value('webhookNotificationEmails')).toBeTruthy()
    })

    it('keeps only the rows whose translated name contains the typed text', async () => {
      const { container } = await renderLoaded()

      const filters =
        container.querySelectorAll<HTMLInputElement>('thead input')
      fireEvent.input(filters[0], { target: { value: 'coupons per cart' } })

      await waitFor(() =>
        expect(
          screen.queryByTestId('system-preferences-value-openAiApiToken')
        ).toBeNull()
      )
      expect(value('maxNumberOfCouponsPerCart')).toBeTruthy()
    })
  })

  describe('edit by type', () => {
    it('edits an enum with a dropdown of its options', async () => {
      await renderLoaded()
      const editor = await startEditing('companyContactPropagation')

      expect(within(editor).getAllByText('UPWARD').length).toBeGreaterThan(0)
    })

    it('edits a boolean with a switch', async () => {
      await renderLoaded()
      await startEditing('couponPermanentDelete')

      const input = editorInput('couponPermanentDelete')
      expect(input.getAttribute('type')).toBe('checkbox')
      expect(input.checked).toBe(true)
    })

    it('edits a list as comma-separated text', async () => {
      await renderLoaded()
      await startEditing('webhookNotificationEmails')

      expect(editorInput('webhookNotificationEmails').value).toBe(
        'ops@example.com, it@example.com'
      )
    })

    it('edits a secret in an empty password field', async () => {
      await renderLoaded()
      await startEditing('openAiApiToken')

      const input = editorInput('openAiApiToken')
      expect(input.getAttribute('type')).toBe('password')
      expect(input.value).toBe('')
    })

    it('edits other preferences as text, starting from the default', async () => {
      await renderLoaded()
      await startEditing('webhookFailureThreshold')

      expect(editorInput('webhookFailureThreshold').value).toBe('100')
    })
  })

  describe('save', () => {
    it('creates a preference the tenant does not have with the typed value', async () => {
      await renderLoaded()
      await startEditing('webhookFailureThreshold')
      fireEvent.change(editorInput('webhookFailureThreshold'), {
        target: { value: '50' },
      })
      save('webhookFailureThreshold')

      await waitFor(() =>
        expect(createConfigurationsCall).toHaveBeenCalledWith(
          [{ key: 'webhookFailureThreshold', value: 50 }],
          { tenant: TENANT }
        )
      )
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'System preference created successfully'
      )
      await waitFor(() =>
        expect(value('webhookFailureThreshold').textContent).toBe('50')
      )
      expect(upsertConfiguration).not.toHaveBeenCalled()
    })

    it('creates a list from comma-separated text', async () => {
      await renderLoaded()
      await startEditing('restrictions')
      fireEvent.change(editorInput('restrictions'), {
        target: { value: 'a, b ,' },
      })
      save('restrictions')

      await waitFor(() =>
        expect(createConfigurationsCall).toHaveBeenCalledWith(
          [{ key: 'restrictions', value: ['a', 'b'] }],
          { tenant: TENANT }
        )
      )
    })

    it('creates a missing secret as secured and shows it masked', async () => {
      delete stored.openAiApiToken
      await renderLoaded()
      expect(value('openAiApiToken').textContent).toBe('')

      await startEditing('openAiApiToken')
      fireEvent.change(editorInput('openAiApiToken'), {
        target: { value: 'new-secret' },
      })
      save('openAiApiToken')

      await waitFor(() =>
        expect(createConfigurationsCall).toHaveBeenCalledWith(
          [{ key: 'openAiApiToken', value: 'new-secret', secured: true }],
          { tenant: TENANT }
        )
      )
      await waitFor(() =>
        expect(value('openAiApiToken').textContent).toBe('********')
      )
      expect(screen.queryByText('new-secret')).toBeNull()
    })

    it('updates a preference the tenant has', async () => {
      await renderLoaded()
      await startEditing('maxNumberOfCouponsPerCart')
      fireEvent.change(editorInput('maxNumberOfCouponsPerCart'), {
        target: { value: '9' },
      })
      save('maxNumberOfCouponsPerCart')

      await waitFor(() =>
        expect(upsertConfiguration).toHaveBeenCalledWith(
          'maxNumberOfCouponsPerCart',
          { value: 9 },
          { tenant: TENANT }
        )
      )
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'System preference updated successfully'
      )
      await waitFor(() =>
        expect(value('maxNumberOfCouponsPerCart').textContent).toBe('9')
      )
    })

    it('saves a switched boolean as a boolean', async () => {
      await renderLoaded()
      await startEditing('couponPermanentDelete')
      fireEvent.click(editorInput('couponPermanentDelete'))
      save('couponPermanentDelete')

      await waitFor(() =>
        expect(upsertConfiguration).toHaveBeenCalledWith(
          'couponPermanentDelete',
          { value: false },
          { tenant: TENANT }
        )
      )
    })

    it('shows the API detail messages and keeps the old value when the save fails', async () => {
      vi.mocked(upsertConfiguration).mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            details: [{ message: 'value is too high' }],
          },
        },
      })
      await renderLoaded()
      await startEditing('maxNumberOfCouponsPerCart')
      fireEvent.change(editorInput('maxNumberOfCouponsPerCart'), {
        target: { value: '999' },
      })
      save('maxNumberOfCouponsPerCart')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to update system preference',
          ['value is too high']
        )
      )
      expect(value('maxNumberOfCouponsPerCart').textContent).toBe('7')
      expect(toast.showSuccess).not.toHaveBeenCalled()
    })

    it('names a failed create in the error toast', async () => {
      vi.mocked(createConfigurationsCall).mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      })
      await renderLoaded()
      await startEditing('webhookFailureThreshold')
      fireEvent.change(editorInput('webhookFailureThreshold'), {
        target: { value: '5' },
      })
      save('webhookFailureThreshold')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to create system preference',
          'Server error'
        )
      )
      expect(value('webhookFailureThreshold').textContent).toBe('100')
    })

    it('sends nothing for an empty secret', async () => {
      await renderLoaded()
      await startEditing('openAiApiToken')
      save('openAiApiToken')

      await waitFor(() =>
        expect(
          screen.queryByTestId('system-preferences-editor-openAiApiToken')
        ).toBeNull()
      )
      expect(createConfigurationsCall).not.toHaveBeenCalled()
      expect(upsertConfiguration).not.toHaveBeenCalled()
      expect(value('openAiApiToken').textContent).toBe('********')
    })
  })

  describe('clear secret', () => {
    const openClear = async () => {
      await renderLoaded()
      await startEditing('openAiApiToken')
      fireEvent.click(
        screen.getByTestId('system-preferences-clear-openAiApiToken')
      )
      return screen.findByText('Clear secret')
    }

    it('offers Clear only while editing a stored secret', async () => {
      await renderLoaded()
      expect(
        screen.queryByTestId('system-preferences-clear-openAiApiToken')
      ).toBeNull()

      await startEditing('maxNumberOfCouponsPerCart')
      expect(
        screen.queryByTestId(
          'system-preferences-clear-maxNumberOfCouponsPerCart'
        )
      ).toBeNull()
    })

    it('deletes the secret after confirming', async () => {
      await openClear()
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Clear value',
        })
      )

      await waitFor(() =>
        expect(deleteConfigurationCall).toHaveBeenCalledWith('openAiApiToken', {
          tenant: TENANT,
        })
      )
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'System preference deleted successfully'
      )
      await waitFor(() => expect(value('openAiApiToken').textContent).toBe(''))
      expect(
        screen.queryByTestId('system-preferences-editor-openAiApiToken')
      ).toBeNull()
    })

    it('keeps the secret when the dialog is cancelled', async () => {
      await openClear()
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Cancel',
        })
      )

      await waitFor(() => expect(screen.queryByText('Clear secret')).toBeNull())
      expect(deleteConfigurationCall).not.toHaveBeenCalled()
    })

    it('shows an error toast when the delete fails', async () => {
      vi.mocked(deleteConfigurationCall).mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      })
      await openClear()
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Clear value',
        })
      )

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to delete system preference',
          'Server error'
        )
      )
    })
  })

  describe('permissions', () => {
    it('disables editing without System Preferences Manager', async () => {
      permissions.granted = [EmployeeDomains.SYSTEM_PREFERENCES_VIEWER]
      await renderLoaded()

      const edit = screen.getByTestId(
        'system-preferences-edit-maxNumberOfCouponsPerCart'
      ) as HTMLButtonElement
      expect(edit.disabled).toBe(true)
      fireEvent.click(edit)
      expect(
        screen.queryByTestId(
          'system-preferences-editor-maxNumberOfCouponsPerCart'
        )
      ).toBeNull()
    })
  })
})
