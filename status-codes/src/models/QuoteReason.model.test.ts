import { describe, expect, it } from 'vitest'
import {
  createQuoteReasonForm,
  isMessageEmpty,
  toQuoteReasonPayload,
  type QuoteReason,
} from './QuoteReason.model'

const loaded = {
  id: 'r1',
  code: 'PRICE',
  type: 'DECLINE',
  message: { en: 'Price changed' },
  metadata: { version: 7 },
} as unknown as QuoteReason

describe('QuoteReason model', () => {
  it('starts a new form as CHANGE with no code or comment', () => {
    expect(createQuoteReasonForm()).toEqual({
      type: 'CHANGE',
      code: '',
      message: undefined,
    })
  })

  it('fills the form from a loaded reason', () => {
    expect(createQuoteReasonForm(loaded)).toEqual({
      type: 'DECLINE',
      code: 'PRICE',
      message: { en: 'Price changed' },
    })
  })

  it('treats a missing or blank comment as empty', () => {
    expect(isMessageEmpty(undefined)).toBe(true)
    expect(isMessageEmpty({})).toBe(true)
    expect(isMessageEmpty({ en: '  ', de: '' })).toBe(true)
    expect(isMessageEmpty({ en: '', de: 'Text' })).toBe(false)
  })

  it('sends no metadata on create', () => {
    expect(
      toQuoteReasonPayload(createQuoteReasonForm(loaded))
    ).not.toHaveProperty('metadata')
  })

  it('sends the loaded version on update', () => {
    expect(
      toQuoteReasonPayload(createQuoteReasonForm(loaded), loaded).metadata
    ).toEqual({ version: 7 })
  })
})
