import { useMemo, type ReactNode } from 'react'
import {
  LocalizedInput as LibraryLocalizedInput,
  type LocalizedValue,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import type Localized from '../../models/Localized.model'

export type LocalizedInputProps = {
  readonly value: Localized | undefined
  readonly onChange: (value: Localized | undefined) => void
  readonly label?: ReactNode
  readonly tooltip?: string
  readonly required?: boolean
  readonly inputId?: string
  readonly className?: string
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
  label,
  tooltip,
  required = false,
  inputId,
  className,
  displayOnly = false,
  errors,
  uiLanguages = false,
  showAllLanguages = false,
  disabled = false,
  error,
}: LocalizedInputProps) => {
  const { languages } = useConfiguration()
  const { contentLanguage } = useDashboardContext()
  const { t, i18n } = useTranslation()

  const resolvedLanguages = useMemo(() => {
    if (uiLanguages) {
      return [
        { id: 'en' },
        { id: 'de' },
      ]
    }
    return languages
  }, [languages, uiLanguages])

  return (
    <LibraryLocalizedInput
      value={value as LocalizedValue | undefined}
      onChange={onChange}
      languages={resolvedLanguages}
      selectedLanguage={uiLanguages ? i18n.language : contentLanguage}
      showAllLanguages={showAllLanguages}
      label={label}
      tooltip={tooltip}
      required={required}
      inputId={inputId}
      className={className}
      displayOnly={displayOnly}
      disabled={disabled}
      error={error}
      errors={errors}
      showLanguagesLabel={t('global.localizedInput.showLanguages')}
      hideLanguagesLabel={t('global.localizedInput.hideLanguages')}
    />
  )
}

export default LocalizedInput
