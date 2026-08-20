import { ReactNode, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'

export type FeatureGatedTypeOption<T extends string> = {
  labelKey: string
  value: T
}

interface FeatureGatedTypeSectionProps<T extends string> {
  labelKey: string
  placeholderKey: string
  selectedType: T | ''
  isEditing: boolean
  optionsReady?: boolean
  options: readonly FeatureGatedTypeOption<T>[]
  getSelectedLabel: (type: T) => string
  requiredMark?: ReactNode
  onTypeChange: (value: T) => void
}

export const FeatureGatedTypeSection = <T extends string>({
  labelKey,
  placeholderKey,
  selectedType,
  isEditing,
  optionsReady = true,
  options,
  getSelectedLabel,
  requiredMark,
  onTypeChange,
}: FeatureGatedTypeSectionProps<T>) => {
  const { t } = useTranslation()

  const typeOptions = useMemo(
    () =>
      options.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [options, t]
  )

  useEffect(() => {
    if (isEditing || !optionsReady || selectedType) {
      return
    }

    if (typeOptions.length === 1) {
      onTypeChange(typeOptions[0].value)
    }
  }, [isEditing, onTypeChange, optionsReady, selectedType, typeOptions])

  return (
    <div className="form-field">
      <label className="field-label">
        {t(labelKey)}
        {!isEditing ? requiredMark : null}
      </label>
      {isEditing ? (
        <InputText
          value={getSelectedLabel(selectedType as T)}
          className="w-full"
          disabled
        />
      ) : (
        <Dropdown
          value={selectedType || null}
          options={typeOptions}
          onChange={(event) => onTypeChange(event.value)}
          className={`w-full${!selectedType ? ' p-invalid' : ''}`}
          placeholder={t(placeholderKey)}
          appendTo="self"
        />
      )}
    </div>
  )
}
