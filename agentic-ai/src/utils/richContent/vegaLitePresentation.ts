import type { Config } from 'vega-lite'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasNonEmptyArray = (
  value: Record<string, unknown>,
  key: string
): boolean => Array.isArray(value[key]) && value[key].length > 0

const isSingleView = (spec: Record<string, unknown>): boolean =>
  !isRecord(spec.facet) &&
  spec.repeat === undefined &&
  !hasNonEmptyArray(spec, 'concat') &&
  !hasNonEmptyArray(spec, 'hconcat') &&
  !hasNonEmptyArray(spec, 'vconcat') &&
  (hasNonEmptyArray(spec, 'layer') || ('mark' in spec && 'encoding' in spec))

export type ChartThemeTokens = {
  readonly fontFamily: string
  readonly heading: string
  readonly body: string
  readonly grid: string
  readonly domain: string
  readonly brand: string
  readonly series: readonly string[]
}

export const defaultChartThemeTokens = (): ChartThemeTokens => ({
  fontFamily: 'Lato, Helvetica, Arial, sans-serif',
  heading: '#1b2029',
  body: '#3e4759',
  grid: '#e8e9eb',
  domain: '#c7cad1',
  brand: '#3b73bb',
  series: [
    '#3b73bb',
    '#2fbea9',
    '#e8615a',
    '#79a3da',
    '#3e4759',
    '#f59e0b',
    '#3b64a0',
    '#828a99',
  ],
})

const tokenOrFallback = (
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string
): string => styles.getPropertyValue(name).trim() || fallback

export const readChartThemeTokens = (): ChartThemeTokens => {
  const fallback = defaultChartThemeTokens()
  if (typeof document === 'undefined') {
    return fallback
  }
  const styles = getComputedStyle(document.documentElement)
  const fontFamily = getComputedStyle(document.body).fontFamily.trim()
  return {
    fontFamily: fontFamily || fallback.fontFamily,
    heading: tokenOrFallback(styles, '--grey-8', fallback.heading),
    body: tokenOrFallback(styles, '--grey-6', fallback.body),
    grid: tokenOrFallback(styles, '--grey-2', fallback.grid),
    domain: tokenOrFallback(styles, '--grey-4', fallback.domain),
    brand: tokenOrFallback(styles, '--blue-5', fallback.brand),
    series: [
      '--blue-5',
      '--color-md-green',
      '--color-md-red',
      '--blue-3',
      '--grey-6',
      '--color-yellow-500',
      '--color-interactive-accent',
      '--grey-5',
    ].map((name, index) =>
      tokenOrFallback(styles, name, fallback.series[index] ?? fallback.brand)
    ),
  }
}

export const chartThemeConfig = (tokens: ChartThemeTokens): Config => ({
  background: 'transparent',
  font: tokens.fontFamily,
  view: { stroke: null },
  axis: {
    labelColor: tokens.body,
    titleColor: tokens.heading,
    gridColor: tokens.grid,
    domainColor: tokens.domain,
    tickColor: tokens.domain,
    labelFontSize: 12,
    titleFontSize: 13,
  },
  legend: {
    labelColor: tokens.body,
    titleColor: tokens.heading,
    labelFontSize: 12,
    titleFontSize: 13,
  },
  title: {
    color: tokens.heading,
    fontSize: 14,
    fontWeight: 600,
    anchor: 'start',
  },
  range: { category: [...tokens.series] },
  bar: { color: tokens.brand },
  line: { color: tokens.brand },
  point: { color: tokens.brand },
  area: { color: tokens.brand },
  arc: { color: tokens.brand },
  rect: { color: tokens.brand },
})

export const CHART_FRAME_MIN_WIDTH = 280
export const CHART_FRAME_MIN_HEIGHT = 200

export const resizeChartFrame = (
  start: { readonly width: number; readonly height: number },
  delta: { readonly x: number; readonly y: number }
): { width: number; height: number } => ({
  width: Math.max(CHART_FRAME_MIN_WIDTH, Math.round(start.width + delta.x)),
  height: Math.max(CHART_FRAME_MIN_HEIGHT, Math.round(start.height + delta.y)),
})

const VIEW_KEYS = [
  'mark',
  'encoding',
  'layer',
  'projection',
  'transform',
  'params',
  'selection',
] as const

const nestFacetView = (
  spec: Record<string, unknown>
): Record<string, unknown> => {
  const faceted = isRecord(spec.facet) || spec.repeat !== undefined
  if (!faceted || isRecord(spec.spec)) {
    return spec
  }
  const inner: Record<string, unknown> = {}
  const outer: Record<string, unknown> = {}
  let moved = false
  Object.entries(spec).forEach(([key, child]) => {
    if ((VIEW_KEYS as readonly string[]).includes(key)) {
      inner[key] = child
      moved = true
      return
    }
    outer[key] = child
  })
  if (!moved) {
    return spec
  }
  return { ...outer, spec: inner }
}

export const prepareChartSpec = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value
  }
  const nested = nestFacetView(value)
  if (!isSingleView(nested)) {
    return nested
  }
  const rest: Record<string, unknown> = {}
  Object.entries(nested).forEach(([key, child]) => {
    if (key !== 'width' && key !== 'autosize') {
      rest[key] = child
    }
  })
  return { ...rest, width: 'container' }
}
