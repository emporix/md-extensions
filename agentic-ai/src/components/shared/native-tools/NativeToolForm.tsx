import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { Button } from 'primereact/button'
import { NativeTool } from '../../../types/Agent'
import { Tool } from '../../../types/Tool'
import {
  DEFAULT_TEAMS_ALLOWED_OPERATIONS,
  getToolAllowedOperations,
} from '../../../utils/teamsRoutingHelpers'

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
    if (!selectedTool || selectedTool.type !== 'teams') {
      return [...DEFAULT_TEAMS_ALLOWED_OPERATIONS].map((operation) => ({
        label: t(`teams_operation_${operation}`),
        value: operation,
      }))
    }
    return getToolAllowedOperations(selectedTool).map((operation) => ({
      label: t(`teams_operation_${operation}`),
      value: operation,
    }))
  }, [selectedTool, t])

  const handleToolChange = (toolId: string) => {
    setSelectedToolId(toolId)
    const tool = availableTools.find((entry) => entry.id === toolId)
    if (tool?.type === 'teams') {
      setSelectedOperations(getToolAllowedOperations(tool))
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
        selectedTool?.type === 'teams' ? selectedOperations : undefined,
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

        {selectedTool?.type === 'teams' ? (
          <div className="form-field">
            <label className="field-label">
              {t('teams_agent_allowed_operations')}
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
              {t('teams_agent_allowed_operations_hint')}
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
              (selectedTool?.type === 'teams' &&
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
