import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { getToolTypeLabel } from '../../utils/toolHelpers'
import { ToolRequiredMark } from './ToolRequiredMark'

interface ToolTypeSectionProps {
  toolType: string
  isEditing: boolean
  onToolTypeChange: (value: string) => void
}

const TOOL_TYPE_OPTIONS = [
  { labelKey: 'slack', value: 'slack' },
  { labelKey: 'rag_custom', value: 'rag_custom' },
  { labelKey: 'rag_emporix', value: 'rag_emporix' },
] as const

export const ToolTypeSection: React.FC<ToolTypeSectionProps> = ({
  toolType,
  isEditing,
  onToolTypeChange,
}) => {
  const { t } = useTranslation()

  const toolTypeOptions = TOOL_TYPE_OPTIONS.map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }))

  return (
    <div className="form-field">
      <label className="field-label">
        {t('tool_type')}
        {!isEditing && <ToolRequiredMark />}
      </label>
      {isEditing ? (
        <InputText
          value={getToolTypeLabel(t, toolType)}
          className="w-full"
          disabled
        />
      ) : (
        <Dropdown
          value={toolType}
          options={toolTypeOptions}
          onChange={(event) => onToolTypeChange(event.value)}
          className={`w-full${!toolType ? ' p-invalid' : ''}`}
          placeholder={t('select_tool_type')}
          appendTo="self"
        />
      )}
    </div>
  )
}
