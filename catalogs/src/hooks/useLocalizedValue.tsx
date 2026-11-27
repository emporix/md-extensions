import { useCallback } from 'react'
import type Localized from '../models/Localized.model'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useTranslation } from 'react-i18next'
import { useDashboardContext } from '../context/Dashboard.context.tsx'
import { findLocalizedEntry } from '../helpers/localized'

export type LocalizedInput = Localized | string | undefined

export const useLocalizedValue = () => {
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const { i18n } = useTranslation()

  // MD `useLocalizedValue` (COP-6374): the host passes the content language as
  // the tenant configuration spells it (`de-at`) while the services store
  // BCP-47 keys (`de-AT`), so the key is matched ignoring case.
  const getContentLangValue = useCallback(
    (val: LocalizedInput) => {
      if (!val) {
        return '--'
      }
      if (typeof val === 'string') {
        return val
      }
      if (!contentLanguage) {
        return '--'
      }
      const entry = findLocalizedEntry(val, contentLanguage)
      if (entry && entry[1]) {
        return entry[1]
      }
      const fallbackEntry = Object.entries(val).find(([, v]) => !!v)
      if (fallbackEntry) {
        return `${fallbackEntry[1]}(${fallbackEntry[0]})`
      }
      return '--'
    },
    [contentLanguage]
  )

  const getUiLangValue = useCallback(
    (val: Localized | string | undefined) => {
      if (val && typeof val === 'string') {
        return val
      } else if (val && Object.keys(val).includes(i18n.language)) {
        return (val as Localized)[i18n.language]
      } else if (val && Object.keys(val).length > 0) {
        return (val as Localized)[Object.keys(val)[0]]
      } else {
        return '--'
      }
    },
    [i18n.language]
  )

  const getUiLangValueWithoutFallback = useCallback(
    (val: Localized | string | undefined) => {
      if (val && typeof val === 'string') {
        return val
      } else if (val && Object.keys(val).includes(i18n.language)) {
        return (val as Localized)[i18n.language]
      } else {
        return '--'
      }
    },
    [i18n.language]
  )

  const createEmptyLocalized = useCallback(() => {
    const emptyLocalized = {} as Localized
    if (languages && languages.length > 0) {
      languages.forEach((lang) => (emptyLocalized[lang.id] = ''))
    }
    return emptyLocalized
  }, [languages])

  return {
    getContentLangValue,
    getUiLangValue,
    getUiLangValueWithoutFallback,
    createEmptyLocalized,
    contentLanguage,
  }
}
