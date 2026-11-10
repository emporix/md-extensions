/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataTableColumnFilterElementOptions } from '@emporix/component-library'
import i18n from '../../translations/i18n'
import { CompanyType } from '../../models/LegalEntity.model'
import CompanyTypeFilter from './CompanyTypeFilter'

const optionsWith = (
  value: unknown,
  filterApplyCallback = vi.fn()
): DataTableColumnFilterElementOptions =>
  ({
    value,
    index: 0,
    filterApplyCallback,
  }) as unknown as DataTableColumnFilterElementOptions

describe('CompanyTypeFilter', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('shows the selected type in the UI language', async () => {
    await i18n.changeLanguage('de')
    render(<CompanyTypeFilter options={optionsWith(CompanyType.SUBSIDIARY)} />)

    expect(screen.getByTestId('company-type-filter').textContent).toContain(
      'Tochtergesellschaft'
    )
  })

  it('clears the filter with a translated button', async () => {
    await i18n.changeLanguage('de')
    const apply = vi.fn()
    render(
      <CompanyTypeFilter options={optionsWith(CompanyType.COMPANY, apply)} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }))

    expect(apply).toHaveBeenCalledWith('', 0)
  })
})
