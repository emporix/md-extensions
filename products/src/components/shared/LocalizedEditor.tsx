import { ChangeEventHandler, useCallback, useMemo, useState } from 'react'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useTranslation } from 'react-i18next'
import { BsGlobe } from 'react-icons/bs'
import { InputTextarea } from 'primereact/inputtextarea'
import Localized from '../../models/Localized'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export interface LocalizedInputProps {
  value: Localized
  onChange: ChangeEventHandler
  uiLanguages?: boolean
  disabled?: boolean
  dataTestId?: string
}

export function LocalizedEditor({
  value,
  onChange,
  uiLanguages,
  disabled,
  dataTestId,
}: LocalizedInputProps) {
  const { t, i18n } = useTranslation()
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const [showLanguages, setShowLanguages] = useState(false)

  const toggleLanguages = useCallback(() => {
    setShowLanguages(!showLanguages)
  }, [showLanguages, setShowLanguages])

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
    (key: string, text: string) => {
      value[key] = text
      // @ts-ignore
      onChange(value)
    },
    [value, onChange]
  )

  return (
    <div>
      {sortedLanguages &&
        sortedLanguages.map((language, index) => {
          return (
            (index === 0 || showLanguages) && (
              <div key={language.id} className="p-inputgroup mt-1">
                <span className="card p-inputgroup-addon font-bold">
                  {language.id.toUpperCase()}
                </span>
                <InputTextarea
                  disabled={disabled}
                  data-test-id={dataTestId}
                  style={{ height: '60px', borderTopLeftRadius: '0' }}
                  value={value[language.id]}
                  onChange={(ev) =>
                    setLocalizedValue(language.id, ev.target.value || '')
                  }
                ></InputTextarea>
              </div>
            )
          )
        })}
      {languages && languages.length > 1 && (
        <div
          className="inline-flex align-items-center cursor-pointer text-sm mt-3"
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

LocalizedEditor.defaultProps = {
  disabled: false,
  uiLanguages: false,
}
