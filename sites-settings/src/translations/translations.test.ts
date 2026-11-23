import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import en from './en'
import de from './de'

const keyPaths = (value: unknown, prefix = ''): string[] =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) =>
        keyPaths(child, prefix ? `${prefix}.${key}` : key)
      )
    : [prefix]

describe('translations', () => {
  it('has every English key in German and the other way round', () => {
    expect(keyPaths(de).sort()).toEqual(keyPaths(en).sort())
  })

  it('has no empty string', () => {
    const values = [en, de].flatMap((bundle) =>
      keyPaths(bundle).map((path) =>
        path
          .split('.')
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            bundle
          )
      )
    )
    expect(values.filter((value) => value === '')).toEqual([])
  })
})

const SRC = fileURLToPath(new URL('..', import.meta.url))

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })

/** Every literal `t('a.b.c')` key in the remote's source. */
const usedKeys = [
  ...new Set(
    sourceFiles(SRC).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)].map(
        (match) => match[1]
      )
    )
  ),
].sort()

describe('keys used in the source', () => {
  it('finds the keys of the ported screens', () => {
    expect(usedKeys).toContain('sites.toasts.successDeleteSite')
    expect(usedKeys).toContain('global.previousPage')
  })

  it.each(usedKeys)('has a text for %s in English and German', (key) => {
    for (const bundle of [en, de]) {
      const value = key
        .split('.')
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown> | undefined)?.[part],
          bundle
        )
      expect(typeof value).toBe('string')
    }
  })
})

describe('MD sites keys', () => {
  it.each([
    'singular',
    'plural',
    'createButton',
    'general',
    'address',
    'coordinates',
    'assistedBuying',
    'details',
    'table.code',
    'table.shipTo',
    'form.cartCalculationScaleTooltip',
    'form.selectTimezone',
    'toasts.errorDeleteDefaultSite',
    'toasts.successDeleteSite',
    'toasts.errorFetchMethods',
  ])('keeps %s in English and German', (path) => {
    for (const bundle of [en, de]) {
      const value = `sites.${path}`
        .split('.')
        .reduce<unknown>(
          (node, key) => (node as Record<string, unknown> | undefined)?.[key],
          bundle
        )
      expect(typeof value).toBe('string')
    }
  })
})

describe('dependencies', () => {
  it('does not depend on primereact', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as Record<string, Record<string, string> | undefined>
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]
    expect(names.filter((name) => name.startsWith('primereact'))).toEqual([])
  })
})
