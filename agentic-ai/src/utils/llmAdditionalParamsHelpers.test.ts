import { describe, expect, it } from 'vitest'
import {
  normalizeAdditionalParamsForSave,
  parseAdditionalParamsJson,
  stringifyAdditionalParams,
} from './llmAdditionalParamsHelpers'

describe('llmAdditionalParamsHelpers', () => {
  it('pretty-prints stored params in stable key order without mutating source', () => {
    const source = { reasoning: { summary: 'auto', effort: 'low' }, b: 1 }
    const printed = stringifyAdditionalParams(source)

    expect(printed.indexOf('"b"')).toBeLessThan(printed.indexOf('"reasoning"'))
    expect(printed.indexOf('"effort"')).toBeLessThan(printed.indexOf('"summary"'))
    expect(source.reasoning.summary).toBe('auto')
  })

  it('parses valid JSON object and normalizes empty to null', () => {
    const parsed = parseAdditionalParamsJson('{"reasoning_effort":"medium"}')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(normalizeAdditionalParamsForSave(parsed.value)).toEqual({
        reasoning_effort: 'medium',
      })
    }

    expect(normalizeAdditionalParamsForSave({})).toBeNull()
    expect(parseAdditionalParamsJson('[]').ok).toBe(false)
    expect(parseAdditionalParamsJson('{').ok).toBe(false)
  })

  it('keeps a __proto__ key when formatting nested objects', () => {
    const nested = Object.create(null) as Record<string, unknown>
    nested.__proto__ = { keep: true }
    const printed = stringifyAdditionalParams({ reasoning: nested, a: 1 })

    expect(printed).toContain('"__proto__"')
    expect(printed).toContain('"keep": true')
    expect(Object.prototype).not.toHaveProperty('keep')

    const parsed = JSON.parse(printed) as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(parsed.reasoning, '__proto__')).toBe(
      true
    )
  })
})
