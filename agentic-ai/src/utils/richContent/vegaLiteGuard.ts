import type { Loader } from 'vega'
import type { EmbedOptions } from 'vega-embed'
import { expressionInterpreter } from 'vega-interpreter'

const URL_KEYS = new Set(['url', 'href'])
const URL_VALUE_PREFIXES = ['http:', 'https:', '//', 'data:', 'javascript:']
const URI_SCHEME = /^[a-z][a-z0-9+.-]*:/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const charsWhere = (value: string, keep: (code: number) => boolean): string =>
  Array.from(value)
    .filter((char) => keep(char.charCodeAt(0)))
    .join('')

const isExternalUrlValue = (value: string): boolean => {
  const stripped = charsWhere(
    value,
    (code) => code > 32 && code !== 127
  ).toLowerCase()
  if (URL_VALUE_PREFIXES.some((prefix) => stripped.startsWith(prefix))) {
    return true
  }
  // Other schemes count only when the value is already one token.
  // Stripping spaces here would turn "Revenue: Q1" into a URI.
  const token = charsWhere(value, (code) => code >= 32 && code !== 127)
    .trim()
    .toLowerCase()
  if (/\s/.test(token)) {
    return false
  }
  return URI_SCHEME.test(token)
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
    if (
      key !== undefined &&
      URL_KEYS.has(key) &&
      typeof node === 'object' &&
      node !== null
    ) {
      paths.push(path)
      return
    }
    if (typeof node === 'string') {
      if (path === '$schema') {
        return
      }
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
