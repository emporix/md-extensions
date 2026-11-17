import { describe, expect, it } from 'vitest'
import {
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
