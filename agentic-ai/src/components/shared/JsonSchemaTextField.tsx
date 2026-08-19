import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import {
  getAgentOutputValidationMessage,
  validateAgentOutputJsonSchema,
} from '../../utils/validateJsonSchema'
import { RequiredMark } from './RequiredMark'

interface JsonSchemaTextFieldProps {
  value: string
  onChange: (value: string) => void
  labelKey: string
  placeholderKey: string
  invalidJsonKey: string
  invalidSchemaKey: string
  required?: boolean
  className?: string
}

export const JsonSchemaTextField = ({
  value,
  onChange,
  labelKey,
  placeholderKey,
  invalidJsonKey,
  invalidSchemaKey,
  required = false,
  className = '',
}: JsonSchemaTextFieldProps) => {
  const { t } = useTranslation()
  const [error, setError] = useState('')

  const validate = useCallback(
    (text: string) => {
      const result = validateAgentOutputJsonSchema(text)
      setError(
        getAgentOutputValidationMessage(result, (key) =>
          key === 'output_format_invalid_json'
            ? t(invalidJsonKey)
            : t(invalidSchemaKey)
        )
      )
    },
    [invalidJsonKey, invalidSchemaKey, t]
  )

  useEffect(() => {
    if (value.trim()) {
      validate(value)
    } else {
      setError('')
    }
  }, [value, validate])

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2)
      onChange(formatted)
      validate(formatted)
    } catch {
      validate(value)
    }
  }

  return (
    <div className={`form-field json-schema-text-field ${className}`.trim()}>
      <label className="field-label">
        {t(labelKey)}
        {required ? <RequiredMark className="mcp-detail-required" /> : null}
      </label>
      <InputTextarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => validate(value)}
        rows={8}
        className={`w-full${error ? ' p-invalid' : ''}`}
        placeholder={t(placeholderKey)}
        spellCheck={false}
      />
      {error ? <small className="p-error">{error}</small> : null}
      <div className="json-schema-text-field-actions">
        <Button
          type="button"
          label={t('format_json_schema')}
          className="p-button-secondary"
          disabled={!value.trim()}
          onClick={handleFormat}
        />
      </div>
    </div>
  )
}
