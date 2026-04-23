import { useCallback, useEffect, useMemo, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useTranslation } from 'react-i18next'
import { BsGlobe } from 'react-icons/bs'
import Localized from '../../models/Localized'
import { isEmptyObject } from '../../helpers/utils'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export interface LocalizedInputProps {
  value: Localized | undefined
  onChange: (value: Localized | undefined) => void
  displayOnly?: boolean
  errors?: {
    [key: string]: {
      message: string
    }
  }
  uiLanguages?: boolean
  showAllLanguages?: boolean
  className?: string
  dataTestId?: string
}

export function LocalizedInput({
  value,
  onChange,
  displayOnly = false,
  errors,
  uiLanguages = false,
  showAllLanguages = false,
  className = '',
  dataTestId,
}: LocalizedInputProps) {
  const { t, i18n } = useTranslation()
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const [state, setState] = useState<Localized>()
  const [showLanguages, setShowLanguages] = useState(showAllLanguages)

  const toggleLanguages = useCallback(() => {
    setShowLanguages(!showLanguages)
  }, [showLanguages, setShowLanguages])

  useEffect(() => {
    setState(languageKeysToLowerCase(value))
  }, [value])

  const languageKeysToLowerCase = (
    val: Localized | undefined
  ): Localized | undefined => {
    if (val !== undefined && val !== null) {
      return Object.fromEntries(
        Object.entries(val).map(([key, value]) => [key.toLowerCase(), value])
      )
    }
    return undefined
  }

  const sortedLanguages = useMemo(() => {
    const selectedLang = !uiLanguages ? contentLanguage : i18n.language
    const languagesToFilter = !uiLanguages
      ? languages
      : [{ id: 'en' }, { id: 'de' }]
    const firstLanguage = languagesToFilter?.find((l) => l.id === selectedLang)
    const restLanguages = languagesToFilter?.filter(
      (l) => l.id !== selectedLang
    )
    if (firstLanguage) {
      return [firstLanguage, ...(restLanguages || [])]
    } else {
      return languagesToFilter
    }
  }, [languages, uiLanguages, i18n.language])

  const setLocalizedValue = useCallback(
    (key: string, value: string) => {
      let newLocalizedValue: Record<string, string> | undefined = {
        ...state,
        [key]: value,
      }
      if (value === '') {
        delete newLocalizedValue[key]
      }
      if (isEmptyObject(newLocalizedValue)) {
        newLocalizedValue = undefined
      }
      onChange(newLocalizedValue)
      setState(newLocalizedValue)
    },
    [state, onChange]
  )
  return (
    <div className={className} data-test-id="localized-inputs">
      {sortedLanguages?.map((language, index) => {
        return (
          (index === 0 || showLanguages) && (
            <div className="mb-2" key={language.id}>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon font-bold">
                  {language.id.toUpperCase()}
                </span>
                <InputText
                  disabled={displayOnly}
                  data-test-id={dataTestId}
                  value={state?.[language.id] ?? ''}
                  onChange={(event) =>
                    setLocalizedValue(language.id, event.target.value)
                  }
                />
              </div>
              {errors?.[language.id]?.message && (
                <small className="p-error">{errors[language.id].message}</small>
              )}
            </div>
          )
        )
      })}
      {sortedLanguages && sortedLanguages.length > 1 && (
        <div
          className="inline-flex align-items-center cursor-pointer text-sm"
          onClick={(event) => {
            event.preventDefault()
            toggleLanguages()
          }}
        >
          <BsGlobe className="mr-2" />
          <span className="underline">
            {showLanguages
              ? t('global.localizedInput.hideLanguages')
              : t('global.localizedInput.showLanguages')}
          </span>
        </div>
      )}
    </div>
  )
}
