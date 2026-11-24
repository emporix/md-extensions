import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
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

describe('MD taxes keys', () => {
  it.each([
    'title',
    'singular',
    'plural',
    'addTaxClass',
    'editTaxClass',
    'label.countryCode',
    'label.countryName',
    'label.taxCode',
    'label.taxName',
    'label.taxRate',
    'label.taxDescription',
    'toast.successTaxDelete',
    'toast.successTaxClassDelete',
    'toast.successTaxClassAdded',
    'toast.successTaxClassEdited',
  ])('keeps %s in English and German', (path) => {
    for (const bundle of [en, de]) {
      const value = `taxes.${path}`
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
