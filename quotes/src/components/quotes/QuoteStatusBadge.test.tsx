/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from '../../translations/i18n'
import { QuoteStatus } from '../../models/Quotes.model'
import QuoteStatusBadge from './QuoteStatusBadge'

/**
 * COP-7116: the status names of the Quotes user guide, each on its own API
 * status ("Pending" is a change request, IN_PROGRESS). The badge upper-cases.
 */
const NAMES: Record<string, Record<QuoteStatus, string>> = {
  en: {
    [QuoteStatus.CREATING]: 'CREATING',
    [QuoteStatus.AWAITING]: 'AWAITING',
    [QuoteStatus.OPEN]: 'OPEN',
    [QuoteStatus.IN_PROGRESS]: 'PENDING',
    [QuoteStatus.ACCEPTED]: 'ACCEPTED',
    [QuoteStatus.DECLINED]: 'DECLINED',
    [QuoteStatus.DECLINED_BY_MERCHANT]: 'DECLINED BY MERCHANT',
    [QuoteStatus.EXPIRED]: 'EXPIRED',
  },
  de: {
    [QuoteStatus.CREATING]: 'IN ERSTELLUNG',
    [QuoteStatus.AWAITING]: 'WARTEND',
    [QuoteStatus.OPEN]: 'OFFEN',
    [QuoteStatus.IN_PROGRESS]: 'AUSSTEHEND',
    [QuoteStatus.ACCEPTED]: 'ANGENOMMEN',
    [QuoteStatus.DECLINED]: 'ABGELEHNT',
    [QuoteStatus.DECLINED_BY_MERCHANT]: 'VOM HÄNDLER ABGELEHNT',
    [QuoteStatus.EXPIRED]: 'ABGELAUFEN',
  },
}

const cases = Object.entries(NAMES).flatMap(([language, names]) =>
  Object.values(QuoteStatus).map(
    (status) => [language, status, names[status]] as const
  )
)

describe('QuoteStatusBadge', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it.each(cases)('in %s names %s as %s', async (language, status, name) => {
    await i18n.changeLanguage(language)
    render(<QuoteStatusBadge status={status} />)

    expect(screen.getByText(name)).toBeTruthy()
  })

  it('shows a status it has no name for as the API code', () => {
    render(<QuoteStatusBadge status={'ON_HOLD' as QuoteStatus} />)

    expect(screen.getByText('ON_HOLD')).toBeTruthy()
  })
})
