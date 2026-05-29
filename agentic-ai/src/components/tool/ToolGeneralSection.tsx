import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { ToolTypeSection } from './ToolTypeSection'
import { ToolRequiredMark } from './ToolRequiredMark'

interface ToolGeneralSectionProps {
  toolId: string
  toolName: string
  toolType: string
  prompt?: string
  showPrompt?: boolean
  isEditing: boolean
  onFieldChange: (field: 'toolId' | 'toolName', value: string) => void
  onToolTypeChange: (value: string) => void
  onPromptChange?: (value: string) => void
}

export const ToolGeneralSection: React.FC<ToolGeneralSectionProps> = ({
  toolId,
  toolName,
  toolType,
  prompt = '',
  showPrompt = false,
  isEditing,
  onFieldChange,
  onToolTypeChange,
  onPromptChange,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="tool-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('tool_id')}
            {!isEditing && <ToolRequiredMark />}
          </label>
          <InputText
            value={toolId}
            onChange={(event) => onFieldChange('toolId', event.target.value)}
            className={`w-full${!isEditing && !toolId.trim() ? ' p-invalid' : ''}`}
            disabled={isEditing}
            placeholder={t('enter_tool_id')}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('tool_name')}
            <ToolRequiredMark />
          </label>
          <InputText
            value={toolName}
            onChange={(event) => onFieldChange('toolName', event.target.value)}
            className={`w-full${!toolName.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_tool_name')}
          />
        </div>
      </div>

      <div className="tool-detail-form-row">
        <ToolTypeSection
          toolType={toolType}
          isEditing={isEditing}
          onToolTypeChange={onToolTypeChange}
        />
      </div>

      {showPrompt && (
        <div className="form-field">
          <label className="field-label">
            {t('prompt')}
            <ToolRequiredMark />
          </label>
          <InputTextarea
            value={prompt}
            onChange={(event) => onPromptChange?.(event.target.value)}
            className={`w-full${!prompt.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_prompt')}
            rows={3}
          />
        </div>
      )}
    </>
  )
}
