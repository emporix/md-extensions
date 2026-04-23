import i18n, { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import TRANSLATIONS_EN from './en'
import TRANSLATIONS_DE from './de'
import { syncPrimeReactLocale } from './syncPrimeReactLocale'
const resources: Resource = {
  en: {
    translation: TRANSLATIONS_EN,
  },
  de: {
    translation: TRANSLATIONS_DE,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  syncPrimeReactLocale(lng)
})
syncPrimeReactLocale(i18n.language)

export default i18n
