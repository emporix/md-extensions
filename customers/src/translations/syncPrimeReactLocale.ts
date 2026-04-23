import {
  addLocale,
  locale as setPrimeLocale,
  localeOptions,
} from 'primereact/api'
import dePrime from './primelocale/de.json'
import enPrime from './primelocale/en.json'

/**
 * Module Federation loads this remote with its own PrimeReact instance.
 * The host registers locales on the host bundle only; Calendar still looks
 * up `locale(de)` here, so we must add locales in this bundle too.
 */
export function syncPrimeReactLocale(i18nLanguage: string | undefined): void {
  const raw = (i18nLanguage ?? 'en').trim()
  const short = raw.split(/[-_]/)[0]?.toLowerCase() || 'en'
  const useDe = short === 'de'

  if (!localeOptions('en')) {
    addLocale('en', enPrime.en)
  }
  if (!localeOptions('de')) {
    addLocale('de', dePrime.de)
  }

  setPrimeLocale(useDe ? 'de' : 'en')
}
