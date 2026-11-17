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

describe('quotes namespace (MD `quotes`)', () => {
  it('is registered with the same keys in English and German', () => {
    const enKeys = keyPaths(en.quotes)
    expect(enKeys.length).toBeGreaterThan(90)
    expect(keyPaths(de.quotes).sort()).toEqual(enKeys.sort())
  })
})

// COP-7116: texts corrected after the A–Z run (MD typos and wrong words).
describe('corrected texts', () => {
  it('fixes the MD typos', () => {
    expect(en.quotes.tabs.general.noLocations).toBe(
      'No shipping location for the selected company'
    )
    expect(en.quotes.tabs.general.noAddresses).toBe(
      'No shipping address for the selected customer'
    )
    expect(de.quotes.toasts.errorChangeStatus).toBe(
      'Status kann nicht geändert werden'
    )
    expect(de.quotes.tabs.general.additionalMessage).toBe(
      'Zusätzliche Nachricht'
    )
    expect(de.segments.tables.customers.columns.email).toBe('Benutzer-E-Mail')
  })

  // An approval opens the quote; "angenommen" is the customer's acceptance.
  it('says "freigegeben" after an approval in German', () => {
    expect(de.quotes.toasts.successApprove).toBe('Angebot freigegeben')
  })
})
