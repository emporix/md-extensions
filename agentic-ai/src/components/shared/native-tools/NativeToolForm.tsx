import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { NativeTool } from '../../../types/Agent'
import { Tool } from '../../../types/Tool'

interface NativeToolFormProps {
  onAdd: (nativeTool: NativeTool) => void
  onCancel: () => void
  availableTools: Tool[]
  existingToolIds: string[]
}

export const NativeToolForm: React.FC<NativeToolFormProps> = ({
  onAdd,
  onCancel,
  availableTools,
  existingToolIds,
}) => {
  const { t } = useTranslation()
  const [selectedToolId, setSelectedToolId] = useState<string>('')

  const availableOptions = availableTools
    .filter((tool) => !existingToolIds.includes(tool.id))
    .map((tool) => ({
      label: tool.name,
      value: tool.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const handleAdd = () => {
    if (selectedToolId) {
      onAdd({ id: selectedToolId })
    }
  }

  return (
    <div className="native-tool-form">
      <div className="native-tool-form-content">
        <div className="form-field">
          <label className="field-label">{t('select_tool')}</label>
          <Dropdown
            value={selectedToolId}
            options={availableOptions}
            onChange={(e) => setSelectedToolId(e.value)}
            placeholder={t('select_tool_placeholder')}
            className="w-full"
            appendTo="self"
          />
        </div>

        <div className="native-tool-form-actions">
          <Button
            type="button"
            label={t('add')}
            onClick={handleAdd}
            disabled={!selectedToolId}
          />
          <Button
            type="button"
            label={t('cancel')}
            onClick={onCancel}
            className="p-button-secondary"
          />
        </div>
      </div>
    </div>
  )
}
