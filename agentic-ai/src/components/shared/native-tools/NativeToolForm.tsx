import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { Button } from 'primereact/button'
import { NativeTool } from '../../../types/Agent'
import { Tool } from '../../../types/Tool'
import {
  getCommunicationToolAllowedOperations,
  isCommunicationNativeToolType,
} from '../../../utils/communicationRoutingHelpers'

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
  const [selectedOperations, setSelectedOperations] = useState<string[]>([])

  const availableOptions = availableTools
    .filter((tool) => !existingToolIds.includes(tool.id))
    .map((tool) => ({
      label: tool.name,
      value: tool.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const selectedTool = availableTools.find((tool) => tool.id === selectedToolId)
  const operationOptions = useMemo(() => {
    if (!selectedTool || !isCommunicationNativeToolType(selectedTool.type)) {
      return []
    }
    return getCommunicationToolAllowedOperations(selectedTool).map(
      (operation) => ({
        label: t(`${selectedTool.type}_operation_${operation}`, operation),
        value: operation,
      })
    )
  }, [selectedTool, t])

  const handleToolChange = (toolId: string) => {
    setSelectedToolId(toolId)
    const tool = availableTools.find((entry) => entry.id === toolId)
    if (tool && isCommunicationNativeToolType(tool.type)) {
      setSelectedOperations(getCommunicationToolAllowedOperations(tool))
    } else {
      setSelectedOperations([])
    }
  }

  const handleAdd = () => {
    if (!selectedToolId) {
      return
    }

    onAdd({
      id: selectedToolId,
      allowedOperations:
        selectedTool && isCommunicationNativeToolType(selectedTool.type)
          ? selectedOperations
          : undefined,
    })
  }

  return (
    <div className="native-tool-form">
      <div className="native-tool-form-content">
        <div className="form-field">
          <label className="field-label">{t('select_tool')}</label>
          <Dropdown
            value={selectedToolId}
            options={availableOptions}
            onChange={(e) => handleToolChange(e.value)}
            placeholder={t('select_tool_placeholder')}
            className="w-full"
            appendTo="self"
          />
        </div>

        {selectedTool && isCommunicationNativeToolType(selectedTool.type) ? (
          <div className="form-field">
            <label className="field-label">
              {t(`${selectedTool.type}_agent_allowed_operations`)}
            </label>
            <MultiSelect
              value={selectedOperations}
              options={operationOptions}
              onChange={(event) =>
                setSelectedOperations((event.value as string[]) ?? [])
              }
              className="w-full"
              display="chip"
              appendTo="self"
            />
            <p className="tool-detail-section-description">
              {t(`${selectedTool.type}_agent_allowed_operations_hint`)}
            </p>
          </div>
        ) : null}

        <div className="native-tool-form-actions">
          <Button
            type="button"
            label={t('add')}
            onClick={handleAdd}
            disabled={
              !selectedToolId ||
              (selectedTool &&
                isCommunicationNativeToolType(selectedTool.type) &&
                selectedOperations.length === 0)
            }
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
