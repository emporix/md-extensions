import { describe, expect, it } from 'vitest'
import { expressionInterpreter } from 'vega-interpreter'
import {
  externalUrlPaths,
  isVegaLiteSpec,
  vegaEmbedOptions,
} from './vegaLiteGuard'

const barSpec = {
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'ordinal' },
    y: { field: 'amount', type: 'quantitative' },
  },
  data: {
    values: [{ category: 'A', amount: 28 }],
  },
}

describe('isVegaLiteSpec', () => {
  it('accepts a bar spec with inline data values', () => {
    expect(isVegaLiteSpec(barSpec)).toBe(true)
    expect(externalUrlPaths(barSpec)).toEqual([])
  })

  it('accepts a schema name that contains vega-lite', () => {
    expect(isVegaLiteSpec({ $schema: 'vega-lite' })).toBe(true)
  })

  it('rejects values that are not a spec object', () => {
    expect(isVegaLiteSpec(null)).toBe(false)
    expect(isVegaLiteSpec([])).toBe(false)
    expect(isVegaLiteSpec({ mark: 'bar' })).toBe(false)
    expect(isVegaLiteSpec({ layer: [] })).toBe(false)
    expect(isVegaLiteSpec({ facet: { row: { field: 'region' } } })).toBe(false)
  })

  it('accepts a layered spec whose mark sits inside layer', () => {
    expect(
      isVegaLiteSpec({
        data: { values: [{ miesiąc: 'Styczeń', sprzedaż: 130, cel: 125 }] },
        layer: [
          {
            mark: 'bar',
            encoding: {
              x: { field: 'miesiąc', type: 'ordinal' },
              y: { field: 'sprzedaż', type: 'quantitative' },
            },
          },
          {
            mark: 'line',
            encoding: {
              x: { field: 'miesiąc', type: 'ordinal' },
              y: { field: 'cel', type: 'quantitative' },
            },
          },
        ],
      })
    ).toBe(true)
  })

  it('accepts a facet spec whose mark sits inside spec', () => {
    expect(
      isVegaLiteSpec({
        data: {
          values: [{ region: 'Polska', month: 'Styczeń', revenue: 100 }],
        },
        facet: { row: { field: 'region', type: 'nominal' } },
        spec: {
          mark: 'line',
          encoding: {
            x: { field: 'month', type: 'ordinal' },
            y: { field: 'revenue', type: 'quantitative' },
          },
        },
      })
    ).toBe(true)
  })

  it('accepts concat, hconcat, vconcat and repeat', () => {
    const unit = { mark: 'bar', encoding: { x: { field: 'a' } } }
    expect(isVegaLiteSpec({ concat: [unit] })).toBe(true)
    expect(isVegaLiteSpec({ hconcat: [unit] })).toBe(true)
    expect(isVegaLiteSpec({ vconcat: [unit] })).toBe(true)
    expect(
      isVegaLiteSpec({
        repeat: { column: ['a', 'b'] },
        spec: unit,
      })
    ).toBe(true)
  })
})

describe('externalUrlPaths', () => {
  it('rejects data.url', () => {
    expect(
      externalUrlPaths({
        ...barSpec,
        data: { url: 'https://example.com/rows.json' },
      })
    ).toEqual(['data.url'])
  })

  it('rejects a nested image url', () => {
    expect(
      externalUrlPaths({
        mark: 'bar',
        encoding: {},
        layer: [
          { mark: { type: 'image', url: 'https://cdn.example/dot.png' } },
        ],
      })
    ).toContain('layer[0].mark.url')
  })

  it('rejects a javascript href', () => {
    expect(
      externalUrlPaths({
        mark: 'bar',
        encoding: {},
        href: ' javascript:alert(1)',
      })
    ).toEqual(['href'])
  })

  it('rejects a label only when the whole value is a url', () => {
    expect(
      externalUrlPaths({
        mark: 'bar',
        encoding: {},
        data: { values: [{ label: 'see https://example.com' }] },
      })
    ).toEqual([])
    expect(
      externalUrlPaths({
        mark: 'bar',
        encoding: {},
        data: { values: [{ label: 'https://example.com' }] },
      })
    ).toEqual(['data.values[0].label'])
  })
})

describe('vegaEmbedOptions', () => {
  it('interprets expressions and refuses external loads', async () => {
    const options = vegaEmbedOptions()
    expect(options.ast).toBe(true)
    expect(options.expr).toBe(expressionInterpreter)
    expect(options.actions).toBe(false)
    expect(options.renderer).toBe('svg')

    const loader = options.loader
    if (!loader || !('load' in loader) || !('sanitize' in loader)) {
      throw new Error('expected a rejecting loader')
    }
    await expect(loader.load('https://example.com/rows.json')).rejects.toThrow(
      'External loads are disabled'
    )
    await expect(
      loader.sanitize('javascript:alert(1)', { context: 'href' })
    ).rejects.toThrow('External loads are disabled')
  })
})
