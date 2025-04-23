import { useCallback } from 'react'
import Localized from '../models/Localized'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useTranslation } from 'react-i18next'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export type LocalizedInput = Localized | string | undefined

export const useLocalizedValue = () => {
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const { i18n } = useTranslation()

  const getContentLangValue = useCallback(
    (val: LocalizedInput) => {
      if (
        val &&
        contentLanguage &&
        typeof val !== 'string' &&
        Object.keys(val).includes(contentLanguage)
      ) {
        return (
          val[contentLanguage] ||
          `${Object.values(val)[0]}(${Object.keys(val)[0]})`
        )
      } else if (val && contentLanguage && typeof val === 'string') {
        return val
      } else {
        return '--'
      }
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
