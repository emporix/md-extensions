import type { Loader } from 'vega'
import type { EmbedOptions } from 'vega-embed'
import { expressionInterpreter } from 'vega-interpreter'

const URL_KEYS = new Set(['url', 'href'])
const URL_VALUE_PREFIXES = ['http:', 'https:', '//', 'data:', 'javascript:']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isExternalUrlValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase()
  return URL_VALUE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

const externalLoadDisabled = (): Promise<never> =>
  Promise.reject(new Error('External loads are disabled'))

const rejectingLoader = (): Loader => ({
  load: () => externalLoadDisabled(),
  sanitize: () => externalLoadDisabled(),
  http: () => externalLoadDisabled(),
  file: () => externalLoadDisabled(),
})

const hasNonEmptyArray = (
  value: Record<string, unknown>,
  key: string
): boolean => Array.isArray(value[key]) && value[key].length > 0

const hasComposition = (value: Record<string, unknown>): boolean => {
  if (
    hasNonEmptyArray(value, 'layer') ||
    hasNonEmptyArray(value, 'concat') ||
    hasNonEmptyArray(value, 'hconcat') ||
    hasNonEmptyArray(value, 'vconcat')
  ) {
    return true
  }
  return (
    isRecord(value.spec) &&
    (isRecord(value.facet) || value.repeat !== undefined)
  )
}

export const isVegaLiteSpec = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }
  if (
    typeof value.$schema === 'string' &&
    value.$schema.includes('vega-lite')
  ) {
    return true
  }
  if ('mark' in value && 'encoding' in value) {
    return true
  }
  return hasComposition(value)
}

export const externalUrlPaths = (value: unknown): string[] => {
  const paths: string[] = []

  const walk = (node: unknown, path: string, key: string | undefined): void => {
    if (typeof node === 'string') {
      const underUrlKey = key !== undefined && URL_KEYS.has(key)
      if (underUrlKey || isExternalUrlValue(node)) {
        paths.push(path)
      }
      return
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        walk(item, `${path}[${index}]`, undefined)
      })
      return
    }
    if (!isRecord(node)) {
      return
    }
    Object.entries(node).forEach(([childKey, child]) => {
      const childPath = path === '' ? childKey : `${path}.${childKey}`
      walk(child, childPath, childKey)
    })
  }

  walk(value, '', undefined)
  return paths
}

export const vegaEmbedOptions = (): EmbedOptions => ({
  ast: true,
  expr: expressionInterpreter,
  actions: false,
  renderer: 'svg',
  loader: rejectingLoader(),
})
