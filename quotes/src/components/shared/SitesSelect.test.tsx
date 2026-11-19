/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import i18n from '../../translations/i18n'
import SitesSelect from './SitesSelect'

const sites = vi.hoisted(() => {
  const main = { code: 'main', name: 'Showcase' }
  const b2b = { code: 'b2b', name: 'Business' }
  return {
    main,
    b2b,
    value: {
      sites: [main, b2b],
      currentSite: main as { code: string; name: string } | undefined,
      updateCurrentSite: vi.fn(),
    },
  }
})

vi.mock('../../context/SitesProvider', () => ({ useSites: () => sites.value }))

describe('SitesSelect (MD header site select)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    sites.value.currentSite = sites.main
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('offers the sites as "name - code" without an "All sites" option', async () => {
    render(<SitesSelect />)

    expect(screen.getByText('Showcase - main')).toBeTruthy()
    fireEvent.click(screen.getByTestId('sites-select-control'))
    const options = (await screen.findAllByRole('option')).map(
      (option) => option.textContent
    )

    expect(options).toEqual(['Showcase - main', 'Business - b2b'])
  })

  it('switches the current site', async () => {
    render(<SitesSelect />)

    fireEvent.click(screen.getByTestId('sites-select-control'))
    fireEvent.mouseDown(
      await screen.findByRole('option', { name: 'Business - b2b' })
    )

    expect(sites.value.updateCurrentSite).toHaveBeenCalledWith(sites.b2b)
  })

  it('can be cleared, which leaves no current site (MD showClear)', () => {
    render(<SitesSelect />)

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(sites.value.updateCurrentSite).toHaveBeenCalledWith(undefined)
  })

  it('shows the placeholder without a site and can be disabled', () => {
    sites.value.currentSite = undefined
    render(<SitesSelect disabled />)

    expect(screen.getByText('Select site')).toBeTruthy()
    expect(
      screen.getByTestId('sites-select-control').getAttribute('aria-disabled')
    ).toBe('true')
  })
})
