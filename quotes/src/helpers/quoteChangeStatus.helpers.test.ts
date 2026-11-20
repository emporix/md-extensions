import { describe, expect, it } from 'vitest'
import {
  QuoteChangeStatusType,
  QuoteReason,
  QuoteStatus,
} from '../models/Quotes.model'
import { deepClone } from './utils'
import {
  buildQuoteChangeStatusPayload,
  buildQuotePendingPayload,
  buildQuoteSendPayload,
  filterQuoteReasonsByType,
  getQuoteChangeStatusTarget,
  toQuoteChangeStatusFormData,
} from './quoteChangeStatus.helpers'

const reason = (id: string, type: QuoteChangeStatusType): QuoteReason => ({
  id,
  code: id.toUpperCase(),
  type,
  message: { en: id },
})

describe('filterQuoteReasonsByType', () => {
  const reasons = [
    reason('price', QuoteChangeStatusType.decline),
    reason('scope', QuoteChangeStatusType.change),
    reason('late', QuoteChangeStatusType.decline),
  ]

  it('offers only DECLINE reasons in the decline dialog', () => {
    expect(
      filterQuoteReasonsByType(reasons, QuoteChangeStatusType.decline).map(
        (r) => r.id
      )
    ).toEqual(['price', 'late'])
  })

  it('does not mutate the reasons', () => {
    const original = deepClone(reasons)
    filterQuoteReasonsByType(reasons, QuoteChangeStatusType.decline)
    expect(reasons).toEqual(original)
  })
})

describe('toQuoteChangeStatusFormData', () => {
  it('sends the reason id and the comment', () => {
    expect(
      toQuoteChangeStatusFormData({
        reason: reason('price', QuoteChangeStatusType.decline),
        comment: 'Too expensive',
      })
    ).toEqual({ quoteReasonId: 'price', comment: 'Too expensive' })
  })

  it('strips a missing reason and an empty comment', () => {
    expect(toQuoteChangeStatusFormData({ comment: '' })).toEqual({})
    expect(toQuoteChangeStatusFormData({})).toEqual({})
  })
})

describe('buildQuoteChangeStatusPayload', () => {
  it('approving sends the quote to the customer (OPEN)', () => {
    expect(getQuoteChangeStatusTarget(QuoteChangeStatusType.change)).toBe(
      QuoteStatus.OPEN
    )
    expect(
      buildQuoteChangeStatusPayload(QuoteChangeStatusType.change, {
        comment: 'Ready',
      })
    ).toEqual({ value: 'OPEN', comment: 'Ready' })
  })

  it('declining ends the quote as DECLINED_BY_MERCHANT with the reason', () => {
    expect(
      buildQuoteChangeStatusPayload(QuoteChangeStatusType.decline, {
        quoteReasonId: 'price',
        comment: 'Too expensive',
      })
    ).toEqual({
      value: 'DECLINED_BY_MERCHANT',
      quoteReasonId: 'price',
      comment: 'Too expensive',
    })
  })

  it('declining without a reason sends only the status, as MD did', () => {
    expect(
      buildQuoteChangeStatusPayload(
        QuoteChangeStatusType.decline,
        toQuoteChangeStatusFormData({})
      )
    ).toEqual({ value: 'DECLINED_BY_MERCHANT' })
  })
})

describe('buildQuoteSendPayload', () => {
  it('"create" on the Approval tab sends the quote as OPEN', () => {
    expect(buildQuoteSendPayload()).toEqual({ value: 'OPEN' })
  })
})

describe('buildQuotePendingPayload', () => {
  it('"send as pending" on the Approval tab sends the quote as IN_PROGRESS', () => {
    expect(buildQuotePendingPayload()).toEqual({ value: 'IN_PROGRESS' })
  })
})
