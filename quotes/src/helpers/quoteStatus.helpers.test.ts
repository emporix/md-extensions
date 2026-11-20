import { describe, expect, it } from 'vitest'
import { QuoteStatus, QuoteStatusColor } from '../models/Quotes.model'
import {
  canChangeQuoteStatus,
  getQuoteApprovalActions,
  hasQuoteStatusDetails,
  isQuoteAwaitingDecision,
  isQuoteCompleted,
} from './quoteStatus.helpers'

// COP-7116 QA: the status box shows above the tabs.
describe('hasQuoteStatusDetails', () => {
  it('is true for every completed quote, with or without a message', () => {
    expect(hasQuoteStatusDetails({ value: QuoteStatus.ACCEPTED })).toBe(true)
    expect(hasQuoteStatusDetails({ value: QuoteStatus.EXPIRED })).toBe(true)
  })

  it('is true for an open quote with a message or a reason', () => {
    expect(
      hasQuoteStatusDetails({ value: QuoteStatus.OPEN, comment: 'Looks good' })
    ).toBe(true)
    expect(
      hasQuoteStatusDetails({
        value: QuoteStatus.IN_PROGRESS,
        quoteReason: { id: 'R1', code: 'PRICE' } as never,
      })
    ).toBe(true)
  })

  it('is false for an open quote without either, and without a status', () => {
    expect(hasQuoteStatusDetails({ value: QuoteStatus.OPEN })).toBe(false)
    expect(
      hasQuoteStatusDetails({ value: QuoteStatus.AWAITING, comment: '  ' })
    ).toBe(false)
    expect(hasQuoteStatusDetails(undefined)).toBe(false)
  })
})

const ALL_STATUSES = Object.values(QuoteStatus)

describe('isQuoteCompleted', () => {
  it('is true exactly for accepted, declined, declined by merchant and expired', () => {
    const completed = ALL_STATUSES.filter((status) => isQuoteCompleted(status))
    expect(completed.sort()).toEqual(
      [
        QuoteStatus.ACCEPTED,
        QuoteStatus.DECLINED,
        QuoteStatus.DECLINED_BY_MERCHANT,
        QuoteStatus.EXPIRED,
      ].sort()
    )
  })

  it('is false while the status is unknown', () => {
    expect(isQuoteCompleted(undefined)).toBe(false)
  })
})

describe('isQuoteAwaitingDecision', () => {
  it('is true only for awaiting and in progress', () => {
    const awaiting = ALL_STATUSES.filter((status) =>
      isQuoteAwaitingDecision(status)
    )
    expect(awaiting.sort()).toEqual(
      [QuoteStatus.AWAITING, QuoteStatus.IN_PROGRESS].sort()
    )
    expect(isQuoteAwaitingDecision(undefined)).toBe(false)
  })
})

describe('canChangeQuoteStatus', () => {
  it('offers approve and decline to a manager for awaiting and in-progress quotes', () => {
    expect(canChangeQuoteStatus(QuoteStatus.AWAITING, true)).toBe(true)
    expect(canChangeQuoteStatus(QuoteStatus.IN_PROGRESS, true)).toBe(true)
  })

  it('never offers them without the manager permission', () => {
    for (const status of ALL_STATUSES) {
      expect(canChangeQuoteStatus(status, false)).toBe(false)
    }
  })

  it('does not offer them for any other status', () => {
    for (const status of [
      QuoteStatus.CREATING,
      QuoteStatus.OPEN,
      QuoteStatus.ACCEPTED,
      QuoteStatus.DECLINED,
      QuoteStatus.DECLINED_BY_MERCHANT,
      QuoteStatus.EXPIRED,
    ]) {
      expect(canChangeQuoteStatus(status, true)).toBe(false)
    }
  })
})

describe('getQuoteApprovalActions', () => {
  it('offers "create" for a quote that is still being created', () => {
    expect(getQuoteApprovalActions(QuoteStatus.CREATING)).toBe('create')
  })

  it('offers decline and approve for awaiting and in-progress quotes', () => {
    expect(getQuoteApprovalActions(QuoteStatus.AWAITING)).toBe('decide')
    expect(getQuoteApprovalActions(QuoteStatus.IN_PROGRESS)).toBe('decide')
  })

  // COP-7125: the employee can start a negotiation round on an open quote.
  it('offers to start a negotiation for an open quote', () => {
    expect(getQuoteApprovalActions(QuoteStatus.OPEN)).toBe('negotiate')
  })

  it('offers no action for the other statuses', () => {
    for (const status of [
      QuoteStatus.ACCEPTED,
      QuoteStatus.DECLINED,
      QuoteStatus.DECLINED_BY_MERCHANT,
      QuoteStatus.EXPIRED,
      undefined,
    ]) {
      expect(getQuoteApprovalActions(status)).toBeUndefined()
    }
  })
})

describe('status badge colours', () => {
  it('keeps the colour of every API status code', () => {
    expect({ ...QuoteStatusColor }).toEqual({
      OPEN: '#4543A4',
      IN_PROGRESS: '#2B95EC',
      ACCEPTED: '#1CAB2F',
      DECLINED: '#FD594D',
      DECLINED_BY_MERCHANT: '#F48032',
      EXPIRED: '#9D626B',
      AWAITING: '#6C9192',
      CREATING: '#E6C20B',
    })
  })
})
