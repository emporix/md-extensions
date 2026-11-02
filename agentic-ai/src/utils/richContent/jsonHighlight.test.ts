import { describe, expect, it } from 'vitest'
import { formatJsonBlock, highlightJson } from './jsonHighlight'

describe('highlightJson', () => {
  it('marks keys and string values apart', () => {
    const tokens = highlightJson(formatJsonBlock({ status: 'paid', total: 2 }))
    expect(tokens.find((token) => token.text === '"status"')?.kind).toBe('key')
    expect(tokens.find((token) => token.text === '"paid"')?.kind).toBe('string')
    expect(tokens.find((token) => token.text === '2')?.kind).toBe('number')
  })

  it('keeps the full pretty-printed text', () => {
    const source = formatJsonBlock({
      required: ['id', 'email'],
      active: true,
    })
    const tokens = highlightJson(source)
    expect(tokens.map((token) => token.text).join('')).toBe(source)
    expect(source).toContain('"email"')
    expect(source).toContain('true')
  })
})
