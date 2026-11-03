import { useCallback, useMemo, useState } from 'react'
import { InputText } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { BsGlobe } from 'react-icons/bs'
import { useConfiguration } from '../../context/ConfigurationProvider'
import type Localized from '../../models/Localized.model'
import styles from './LocalizedEditor.module.scss'

export interface LocalizedEditorProps {
  readonly value: Localized
  readonly onChange: (value: Localized) => void
  readonly uiLanguages?: boolean
  readonly disabled?: boolean
  readonly dataTestId?: string
}

/** Case-insensitive lookup of a language entry (MD `helpers/localized`). */
const findLocalizedEntry = (
  input: Localized | undefined,
  lang: string
): [string, string] | undefined => {
  if (input === undefined || input === null || typeof input === 'string') {
    return undefined
  }
  const target = lang.toLowerCase()
  return Object.entries(input).find(([key]) => key.toLowerCase() === target)
}

/** Immutable write preserving the existing key casing (MD `helpers/localized`). */
const setLocalizedEntry = (
  input: Localized | undefined,
  lang: string,
  value: string
): Localized => {
  const existing = findLocalizedEntry(input, lang)
  const key = existing ? existing[0] : lang
  const target = lang.toLowerCase()
  const next: Localized = Object.fromEntries(
    Object.entries(input ?? {}).filter(
      ([existingKey]) => existingKey.toLowerCase() !== target
    )
  )
  next[key] = value
  return next
}

/**
 * Multi-line localized text input (MD `components/framework/LocalizedEditor`).
 * MD renders one plain textarea per language (not a rich-text editor), so the
 * persisted value stays plain text; built on CL `InputText textarea` with the
 * same language-addon layout as CL `LocalizedInput`.
 */
export const LocalizedEditor = ({
  value,
  onChange,
  uiLanguages = false,
  disabled = false,
  dataTestId,
}: LocalizedEditorProps) => {
  const { t, i18n } = useTranslation()
  const { languages, contentLanguage } = useConfiguration()
  const [showLanguages, setShowLanguages] = useState(false)

  const toggleLanguages = useCallback(() => {
    setShowLanguages((prev) => !prev)
  }, [])

  const sortedLanguages = useMemo(() => {
    const selectedLang = uiLanguages ? i18n.language : contentLanguage
    const languagesToFilter = uiLanguages
      ? [{ id: 'en' }, { id: 'de' }]
      : languages
    const firstLanguage = languagesToFilter.find((l) => l.id === selectedLang)
    const restLanguages = languagesToFilter.filter((l) => l.id !== selectedLang)
    return firstLanguage ? [firstLanguage, ...restLanguages] : languagesToFilter
  }, [languages, uiLanguages, i18n.language, contentLanguage])

  const setLocalizedValue = useCallback(
    (key: string, text: string) => {
      onChange(setLocalizedEntry(value, key, text))
    },
    [value, onChange]
  )

  return (
    <div className={styles.editor}>
      {sortedLanguages.map(
        (language, index) =>
          (index === 0 || showLanguages) && (
            <div key={language.id} className={styles.inputGroup}>
              <span className={styles.addon}>{language.id.toUpperCase()}</span>
              <InputText
                textarea
                className={styles.textarea}
                readOnly={disabled}
                data-test-id={dataTestId}
                value={findLocalizedEntry(value, language.id)?.[1] ?? ''}
                onChange={(ev) =>
                  setLocalizedValue(language.id, ev.target.value || '')
                }
              />
            </div>
          )
      )}
      {sortedLanguages.length > 1 && (
        <button
          type="button"
          className={styles.toggle}
          onClick={toggleLanguages}
        >
          <BsGlobe className={styles.toggleIcon} aria-hidden />
          <span className={styles.toggleLabel}>
            {showLanguages
              ? t('global.localizedInput.hideLanguages')
              : t('global.localizedInput.showLanguages')}
          </span>
        </button>
      )}
    </div>
  )
}
