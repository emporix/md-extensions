/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from '../../translations/i18n'
import type { Quote } from '../../models/Quotes.model'
import { unpricedQuote } from '../../test/quoteNullFixtures'
import FallbackCountryNotice from './FallbackCountryNotice'

const sites = vi.hoisted(() => ({ value: [] as unknown[] | null }))
vi.mock('../../context/SitesProvider', () => ({
  useSites: () => ({ sites: sites.value }),
}))

const site = (extra: object = {}) => ({
  code: 'main',
  shipToCountries: ['DE', 'GB'],
  ...extra,
})

const NOTICE = 'quote-fallback-country-notice'

describe('FallbackCountryNotice', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    sites.value = [site()]
  })

  afterEach(cleanup)

  it('names the fallback country for a quote without an address and with an unpriced product', () => {
    render(<FallbackCountryNotice quote={unpricedQuote()} />)
    expect(screen.getByTestId(NOTICE).textContent).toContain(
      'The quote has no address, so prices were matched for DE. Products without a price may be priced for other countries.'
    )
  })

  it('names the home base country when the site ships to it', () => {
    sites.value = [site({ homeBase: { address: { country: 'GB' } } })]
    render(<FallbackCountryNotice quote={unpricedQuote()} />)
    expect(screen.getByTestId(NOTICE).textContent).toContain('matched for GB.')
  })

  it('is hidden when the quote has a shipping address', () => {
    const quote = {
      ...unpricedQuote(),
      shippingAddress: { countryCode: 'PL' },
    } as Quote
    render(<FallbackCountryNotice quote={quote} />)
    expect(screen.queryByTestId(NOTICE)).toBeNull()
  })

  it('is hidden when every product has a price', () => {
    const quote = unpricedQuote()
    const priced = {
      ...quote,
      items: quote.items.map((item) => ({
        ...item,
        price: { unitPrice: 1, totalNetValue: 1 },
      })),
    } as unknown as Quote
    render(<FallbackCountryNotice quote={priced} />)
    expect(screen.queryByTestId(NOTICE)).toBeNull()
  })

  it('is hidden when no country can be determined', () => {
    sites.value = [site({ shipToCountries: [] })]
    render(<FallbackCountryNotice quote={unpricedQuote()} />)
    expect(screen.queryByTestId(NOTICE)).toBeNull()
  })

  it('is hidden before the quote loads', () => {
    render(<FallbackCountryNotice quote={undefined} />)
    expect(screen.queryByTestId(NOTICE)).toBeNull()
  })
})
