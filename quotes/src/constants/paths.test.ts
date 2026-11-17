import { describe, expect, it } from 'vitest'
import {
  HOST_CUSTOMER_PATH,
  MODULE_ROOT,
  quoteAddPath,
  quoteDetailPath,
  quotesListPath,
} from './paths'

describe('quote paths', () => {
  it('maps MD pathname routes to hash routes under the module root', () => {
    expect(MODULE_ROOT).toBe('/')
    expect(quotesListPath()).toBe('/')
    expect(quoteAddPath()).toBe('/add')
    expect(quoteDetailPath('Q1000814')).toBe('/Q1000814')
  })

  it('keeps an id with reserved characters in one path segment', () => {
    expect(quoteDetailPath('Q/1#2?3')).toBe('/Q%2F1%232%3F3')
  })
})

describe('host customer path', () => {
  // MD `customerDetailUrl`: customers is a remote with a HashRouter.
  it('opens the customer in the customers remote', () => {
    expect(HOST_CUSTOMER_PATH('CU1')).toBe('/apps/management/customers#/CU1')
  })

  it('keeps a customer id with reserved characters in one path segment', () => {
    expect(HOST_CUSTOMER_PATH('C/1#2?3')).toBe(
      '/apps/management/customers#/C%2F1%232%3F3'
    )
  })
})
