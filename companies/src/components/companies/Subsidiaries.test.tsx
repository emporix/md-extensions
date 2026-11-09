/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '../../translations/i18n'
import { RefreshValuesProvider } from '../../context/RefreshValuesProvider'
import { Subsidiaries } from './Subsidiaries'

const api = vi.hoisted(() => ({ getSubsidiaries: vi.fn() }))

vi.mock('../../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => ({ getSubsidiaries: api.getSubsidiaries }),
}))
// Owned and tested on its own; the row actions are not under test here.
vi.mock('./LegalEntityActions', () => ({
  LegalEntityActions: () => null,
}))

const subsidiaries = [
  {
    id: 'S-1',
    name: 'Acme Berlin',
    legalInfo: { countryOfRegistration: 'DE', taxRegistrationNumber: 'DE-1' },
  },
  {
    id: 'S-2',
    name: 'Acme Paris',
    legalInfo: { countryOfRegistration: 'FR', taxRegistrationNumber: 'FR-2' },
  },
]

const renderSubsidiaries = () =>
  render(
    <MemoryRouter>
      <RefreshValuesProvider>
        <Subsidiaries legalEntity={{ id: 'C-1' }} />
      </RefreshValuesProvider>
    </MemoryRouter>
  )

const table = () => screen.getByTestId('subsidiaries-table')
// The filter row is the header row with inputs (the paginator has its own).
const filterRow = () => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => r.querySelector('input'))
  if (!row) throw new Error('no filter row')
  return row
}
const filterInputs = () =>
  within(filterRow()).getAllByRole('textbox') as HTMLInputElement[]

describe('Subsidiaries', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    api.getSubsidiaries.mockResolvedValue({ values: subsidiaries })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('has the companies list filter row: text filters, no clear buttons', async () => {
    renderSubsidiaries()
    await within(table()).findByText('Acme Berlin')

    // Name, country of registration and tax number, all free text.
    expect(filterInputs()).toHaveLength(3)
    expect(within(filterRow()).queryByRole('combobox')).toBeNull()
    expect(
      within(filterRow()).queryByRole('button', { name: /clear/i })
    ).toBeNull()
  })

  it('filters by country of registration as text', async () => {
    renderSubsidiaries()
    await within(table()).findByText('Acme Berlin')

    fireEvent.change(filterInputs()[1], { target: { value: 'fr' } })

    await waitFor(() =>
      expect(within(table()).queryByText('Acme Berlin')).toBeNull()
    )
    expect(within(table()).getByText('Acme Paris')).toBeTruthy()
  })
})
