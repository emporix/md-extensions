import { useCallback, useEffect, useMemo, useState } from 'react'
import { InputText } from '@emporix/component-library'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useTranslation } from 'react-i18next'
import { BsGlobe } from 'react-icons/bs'
import type Localized from '../../models/Localized.model'
import { isEmptyObject } from '../../helpers/utils'
import { useDashboardContext } from '../../context/Dashboard.context'

export type LocalizedInputProps = {
  readonly value: Localized | undefined
  readonly onChange: (value: Localized | undefined) => void
  readonly displayOnly?: boolean
  readonly errors?: {
    [key: string]: {
      message: string
    }
  }
  readonly uiLanguages?: boolean
  readonly showAllLanguages?: boolean
  readonly disabled?: boolean
  readonly error?: string
}

const LocalizedInput = ({
  value,
  onChange,
  displayOnly = false,
  errors,
  uiLanguages = false,
  showAllLanguages = false,
  disabled = false,
  error,
}: LocalizedInputProps) => {
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const { i18n } = useTranslation()
  const [localizedValue, setLocalizedValue] = useState<Localized | undefined>(
    value
  )

  useEffect(() => {
    setLocalizedValue(value)
  }, [value])

  const activeLanguages = useMemo(() => {
    if (showAllLanguages) {
      return languages
    }
    const lang = uiLanguages ? i18n.language : contentLanguage
    return languages.filter((l) => l.id === lang)
  }, [languages, showAllLanguages, uiLanguages, i18n.language, contentLanguage])

  const handleChange = useCallback(
    (langId: string, text: string) => {
      const newLocalizedValue = {
        ...(localizedValue ?? {}),
        [langId]: text,
      }
      setLocalizedValue(newLocalizedValue)
      onChange(isEmptyObject(newLocalizedValue) ? undefined : newLocalizedValue)
    },
    [localizedValue, onChange]
  )

  return (
    <div className="localized-input">
      {activeLanguages.map((lang) => (
        <div key={lang.id} className="flex align-items-center gap-2 mb-2">
          <BsGlobe />
          <InputText
            inputId={`localized-${lang.id}`}
            value={localizedValue?.[lang.id] ?? ''}
            disabled={disabled || displayOnly}
            onChange={(e) => handleChange(lang.id, e.target.value)}
            error={errors?.[lang.id]?.message ?? error}
          />
        </div>
      ))}
    </div>
  )
}

export default LocalizedInput
