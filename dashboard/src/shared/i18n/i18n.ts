import { useMemo } from 'react'
import { en } from './translations.en'
import { de } from './translations.de'

type TranslationDict = typeof en

const translations: Record<string, TranslationDict> = {
  en,
  de,
}

const defaultLang = 'en'

export const getTranslations = (lang: string): TranslationDict =>
  translations[lang] ?? translations[defaultLang] ?? en

const getNested = (obj: unknown, key: string): string | undefined => {
  const parts = key.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    cur = (cur as Record<string, unknown>)?.[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string

const interpolate = (
  template: string,
  params: Record<string, string | number>
): string =>
  template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`
  )

export const getT = (lang: string): TranslateFn => {
  const dict = getTranslations(lang)
  return (key: string, params?: Record<string, string | number>) => {
    const value = getNested(dict, key) ?? key
    return params ? interpolate(value, params) : value
  }
}

export const useTranslation = (language: string): { t: TranslateFn } =>
  useMemo(() => ({ t: getT(language) }), [language])
