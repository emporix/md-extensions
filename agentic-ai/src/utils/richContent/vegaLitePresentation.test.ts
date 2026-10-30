import { describe, expect, it } from 'vitest'
import {
  chartThemeConfig,
  defaultChartThemeTokens,
  prepareChartSpec,
  resizeChartFrame,
} from './vegaLitePresentation'

const barSpec = {
  width: 240,
  autosize: 'pad',
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'ordinal' },
    y: { field: 'amount', type: 'quantitative' },
  },
  data: { values: [{ category: 'A', amount: 28 }] },
}

describe('prepareChartSpec', () => {
  it('stretches a single chart to the container and leaves the input unchanged', () => {
    const fitted = prepareChartSpec(barSpec)

    expect(fitted).toMatchObject({ width: 'container', mark: 'bar' })
    expect(fitted).not.toHaveProperty('autosize')
    expect(barSpec.width).toBe(240)
  })

  it('stretches a layered chart from the outer spec', () => {
    const fitted = prepareChartSpec({
      width: 300,
      layer: [
        { mark: 'bar', encoding: { y: { field: 'sprzedaż' } } },
        { mark: 'line', encoding: { y: { field: 'cel' } } },
      ],
    })

    expect(fitted).toMatchObject({ width: 'container' })
    expect(fitted).toHaveProperty('layer')
  })

  it('leaves facet and concat specs to scale with the bubble', () => {
    const facet = {
      facet: { row: { field: 'region' } },
      spec: { mark: 'line', encoding: { x: { field: 'month' } } },
    }
    const concat = {
      vconcat: [{ mark: 'bar', encoding: { x: { field: 'a' } } }],
    }

    expect(prepareChartSpec(facet)).toBe(facet)
    expect(prepareChartSpec(concat)).toBe(concat)
  })
})

describe('resizeChartFrame', () => {
  it('grows and shrinks from the drag delta', () => {
    expect(
      resizeChartFrame({ width: 400, height: 300 }, { x: 80, y: -40 })
    ).toEqual({ width: 480, height: 260 })
  })

  it('stops at the minimum frame size', () => {
    expect(
      resizeChartFrame({ width: 300, height: 220 }, { x: -400, y: -400 })
    ).toEqual({ width: 280, height: 200 })
  })
})

describe('prepareChartSpec facet nesting', () => {
  it('moves a sibling layer and encoding under spec', () => {
    const spec = {
      data: { values: [{ kraj: 'Polska' }] },
      encoding: { x: { field: 'miesiąc' } },
      layer: [{ mark: 'line' }],
      facet: { row: { field: 'kraj', title: null } },
      resolve: { scale: { y: 'shared' } },
    }

    const fitted = prepareChartSpec(spec)

    expect(fitted).toMatchObject({
      data: spec.data,
      facet: spec.facet,
      resolve: spec.resolve,
      spec: { encoding: spec.encoding, layer: spec.layer },
    })
    expect(fitted).not.toHaveProperty('layer')
    expect(spec).toHaveProperty('layer')
  })

  it('leaves a facet spec that already has spec', () => {
    const spec = {
      facet: { row: { field: 'region' } },
      spec: { mark: 'line', encoding: { x: { field: 'month' } } },
    }

    expect(prepareChartSpec(spec)).toBe(spec)
  })
})

describe('chartThemeConfig', () => {
  it('uses the dashboard palette and a transparent background', () => {
    const tokens = defaultChartThemeTokens()
    const config = chartThemeConfig(tokens)

    expect(config.background).toBe('transparent')
    expect(config.font).toBe(tokens.fontFamily)
    const category = config.range?.category
    expect(config.bar?.color).toBe('#3b73bb')
    expect(Array.isArray(category) ? category[0] : undefined).toBe('#3b73bb')
    expect(config.axis?.gridColor).toBe('#e8e9eb')
    expect(config.view?.stroke).toBeNull()
  })
})
