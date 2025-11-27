import { useState, useEffect, useCallback } from 'react'

const KEY_CONFIG = 'config'
export type Language = {
  id: string
  label: string
  default: boolean
  required: boolean
}

const DEFAULT_LANGUAGES: Language[] = [
  { id: 'en', label: 'English', default: true, required: true },
] as const

interface Configuration {
  languages?: Language[]
  [key: string]: unknown
}

export const getLanguagesFromStorage = (): Language[] => {
  try {
    const rawConfig = localStorage.getItem(KEY_CONFIG)
    if (!rawConfig) {
      return DEFAULT_LANGUAGES
    }

    const config: Configuration = JSON.parse(rawConfig)
    if (config.languages && Array.isArray(config.languages)) {
      return config.languages
    }

    return DEFAULT_LANGUAGES
  } catch (error) {
    console.error('Failed to parse configuration from localStorage:', error)
    return DEFAULT_LANGUAGES
  }
}

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>(() =>
    getLanguagesFromStorage()
  )

  const loadLanguages = useCallback(() => {
    const loadedLanguages = getLanguagesFromStorage()
    setLanguages(loadedLanguages)
  }, [])

  // Listen for storage changes to update languages when config changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === KEY_CONFIG) {
        loadLanguages()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadLanguages])

  return {
    languages,
    refetch: loadLanguages,
  }
}
