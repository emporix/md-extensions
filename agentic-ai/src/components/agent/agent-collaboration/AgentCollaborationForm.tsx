import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { AgentCollaboration } from '../../../types/Agent'
import { CustomAgent } from '../../../types/Agent'
import { getLocalizedValue } from '../../../utils/agentHelpers'
import { iconMap } from '../../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppState } from '../../../types/common'

interface AgentCollaborationFormProps {
  onAdd: (collaboration: AgentCollaboration) => void
  onCancel: () => void
  availableAgents: CustomAgent[]
  editingCollaboration?: AgentCollaboration
  currentAgentType?: string
  appState: AppState
}

export const AgentCollaborationForm: React.FC<AgentCollaborationFormProps> = ({
  onAdd,
  onCancel,
  availableAgents,
  editingCollaboration,
  currentAgentType,
  appState,
}) => {
  const { t } = useTranslation()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    editingCollaboration?.agentId || null
  )
  const [description, setDescription] = useState(
    editingCollaboration?.description || ''
  )

  const agentOptions = availableAgents
    .filter((agent) =>
      agent.id === 'emporix--collaboration'
        ? currentAgentType === 'complaint' || currentAgentType === 'anti_fraud'
        : true
    )
    .map((agent) => ({
      label: (
        <div className="agent-option">
          <FontAwesomeIcon
            icon={iconMap[agent.icon || 'robot'] || iconMap.robot}
            className="agent-option-icon"
          />
          <span>{getLocalizedValue(agent.name, appState.contentLanguage)}</span>
        </div>
      ),
      value: agent.id,
      sortName: getLocalizedValue(agent.name, appState.contentLanguage),
    }))
    .sort((a, b) => a.sortName.localeCompare(b.sortName))

  const isFormValid = () => {
    return selectedAgentId && description.trim()
  }

  const handleAdd = () => {
    if (!isFormValid() || !selectedAgentId) return

    const collaboration: AgentCollaboration = {
      agentId: selectedAgentId,
      description: description.trim(),
    }

    onAdd(collaboration)
  }

  return (
    <div className="agent-collaboration-form">
      <div className="form-field">
        <label className="field-label">{t('agent')}</label>
        <Dropdown
          value={selectedAgentId}
          options={agentOptions}
          onChange={(e) => setSelectedAgentId(e.value)}
          placeholder={t('select_agent')}
          className="w-full"
          appendTo="self"
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('description')}</label>
        <InputTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('enter_description')}
          className="w-full"
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button
          type="button"
          label={t('cancel')}
          onClick={onCancel}
          className="p-button-secondary"
        />
        <Button
          type="button"
          label={editingCollaboration ? t('update') : t('add')}
          onClick={handleAdd}
          disabled={!isFormValid()}
        />
      </div>
    </div>
  )
}
