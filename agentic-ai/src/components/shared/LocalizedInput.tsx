import React, { useCallback, useMemo, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { LocalizedString } from '../../types/Agent'
import { AppState } from '../../types/common'
import { useLanguages } from '../../hooks/useLanguages'

export interface LocalizedInputProps {
  value: LocalizedString
  onChange: (value: LocalizedString) => void
  displayOnly?: boolean
  error?: string
  invalid?: boolean
  className?: string
  dataTestId?: string
  appState: AppState
  placeholder?: string
  multiline?: boolean
  rows?: number
}

export const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChange,
  displayOnly = false,
  error,
  invalid = false,
  className = '',
  dataTestId,
  appState,
  placeholder,
  multiline = false,
  rows = 2,
}) => {
  const { t } = useTranslation()
  const [state, setState] = useState<LocalizedString>(value)
  const [showLanguages, setShowLanguages] = useState(false)
  const { languages } = useLanguages()

  const toggleLanguages = useCallback(() => {
    setShowLanguages(!showLanguages)
  }, [showLanguages])

  const sortedLanguages = useMemo(() => {
    const contentLanguage = appState.contentLanguage.toLowerCase()
    const firstLanguage = languages.find(
      (l) => l.id.toLowerCase() === contentLanguage
    )
    const restLanguages = languages.filter(
      (l) => l.id.toLowerCase() !== contentLanguage
    )
    if (firstLanguage) {
      return [firstLanguage, ...restLanguages]
    }
    return languages
  }, [languages, appState.contentLanguage])

  const setLocalizedValue = useCallback(
    (key: string, val: string) => {
      let newLocalizedValue: LocalizedString = {
        ...state,
        [key]: val,
      }
      if (val === '') {
        delete newLocalizedValue[key]
      }
      if (Object.keys(newLocalizedValue).length === 0) {
        newLocalizedValue = {} as LocalizedString
      }
      onChange(newLocalizedValue)
      setState(newLocalizedValue)
    },
    [state, onChange]
  )

  const showInvalidState = invalid || Boolean(error)

  return (
    <div className={className} data-test-id="localized-inputs">
      {sortedLanguages?.map((language, index) => {
        const languageKey = language.id.toLowerCase()
        const fieldValue = state?.[languageKey] || ''

        return (
          (index === 0 || showLanguages) && (
            <div className="mb-2" key={language.id}>
              <div className="p-inputgroup">
                <span
                  style={{
                    borderColor: showInvalidState ? 'var(--red-500)' : '',
                  }}
                  className="p-inputgroup-addon font-bold"
                >
                  {language.id.toUpperCase()}
                </span>
                {multiline ? (
                  <InputTextarea
                    style={{
                      borderColor: showInvalidState ? 'var(--red-500)' : '',
                    }}
                    className={showInvalidState ? 'p-invalid' : ''}
                    disabled={displayOnly}
                    data-test-id={dataTestId}
                    value={fieldValue}
                    onChange={(event) =>
                      setLocalizedValue(languageKey, event.target.value)
                    }
                    placeholder={placeholder}
                    rows={rows}
                  />
                ) : (
                  <InputText
                    style={{
                      borderColor: showInvalidState ? 'var(--red-500)' : '',
                    }}
                    className={showInvalidState ? 'p-invalid' : ''}
                    disabled={displayOnly}
                    data-test-id={dataTestId}
                    value={fieldValue}
                    onChange={(event) =>
                      setLocalizedValue(languageKey, event.target.value)
                    }
                    placeholder={placeholder}
                  />
                )}
              </div>
            </div>
          )
        )
      })}
      {error ? (
        <small style={{ marginTop: '-.25rem' }} className="p-error block mb-2">
          {error}
        </small>
      ) : null}
      {sortedLanguages && sortedLanguages.length > 1 && (
        <div
          className="flex align-items-center text-sm"
          onClick={(event) => {
            event.preventDefault()
            toggleLanguages()
          }}
          style={{ cursor: 'pointer', marginTop: '8px' }}
        >
          <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px' }} />
          <span className="underline">
            {showLanguages
              ? t('hide_languages', 'Hide languages')
              : t('show_languages', 'Show languages')}
          </span>
        </div>
      )}
    </div>
  )
}
