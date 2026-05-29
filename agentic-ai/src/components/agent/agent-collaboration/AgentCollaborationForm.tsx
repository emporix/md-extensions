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
import {
  buildCollaboration,
  isCollaborationRowValid,
} from '../../../utils/agentCollaborationHelpers'

interface AgentCollaborationFormProps {
  onAdd: (collaboration: AgentCollaboration) => void
  onCancel: () => void
  availableAgents: CustomAgent[]
  editingCollaboration?: AgentCollaboration
  appState: AppState
  variant?: 'default' | 'detail'
  className?: string
}

export const AgentCollaborationForm: React.FC<AgentCollaborationFormProps> = ({
  onAdd,
  onCancel,
  availableAgents,
  editingCollaboration,
  appState,
  variant = 'default',
  className,
}) => {
  const { t } = useTranslation()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    editingCollaboration?.agentId ?? null
  )
  const [prompt, setPrompt] = useState(editingCollaboration?.description ?? '')
  const [showPromptError, setShowPromptError] = useState(false)

  const agentOptions = availableAgents
    .map((agent) => ({
      label: (
        <div className="agent-option">
          <FontAwesomeIcon
            icon={iconMap[agent.icon ?? 'robot'] ?? iconMap.robot}
            className="agent-option-icon"
          />
          <span>{getLocalizedValue(agent.name, appState.contentLanguage)}</span>
        </div>
      ),
      value: agent.id,
      sortName: getLocalizedValue(agent.name, appState.contentLanguage),
    }))
    .sort((a, b) => a.sortName.localeCompare(b.sortName))

  const isValid = isCollaborationRowValid(selectedAgentId, prompt)

  const handleAdd = () => {
    if (!selectedAgentId) {
      return
    }

    if (!prompt.trim()) {
      setShowPromptError(true)
      return
    }

    onAdd(buildCollaboration(selectedAgentId, prompt))
  }

  const handleAgentChange = (agentId: string | null) => {
    setSelectedAgentId(agentId)
    setShowPromptError(false)
  }

  const handlePromptChange = (value: string) => {
    setPrompt(value)
    if (value.trim()) {
      setShowPromptError(false)
    }
  }

  const isDetailVariant = variant === 'detail'
  const formClassName = [
    isDetailVariant
      ? 'agent-detail-collaboration-form'
      : 'agent-collaboration-form',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const fieldsClassName = isDetailVariant
    ? 'agent-detail-collaboration-row-fields'
    : undefined

  const promptPlaceholder = isDetailVariant
    ? selectedAgentId
      ? t('collaboration_prompt_placeholder')
      : t('collaboration_please_select')
    : t('enter_description')

  const promptLabel = isDetailVariant
    ? t('collaboration_prompt')
    : t('description')

  return (
    <div className={formClassName}>
      <div className={fieldsClassName}>
        <div className="form-field">
          <label className="field-label">{t('agent')}</label>
          <Dropdown
            value={selectedAgentId}
            options={agentOptions}
            onChange={(event) => handleAgentChange(event.value)}
            placeholder={t('select_an_option')}
            className="w-full"
            appendTo="self"
          />
        </div>

        <div className="form-field">
          <label className="field-label">{promptLabel}</label>
          <InputTextarea
            value={prompt}
            onChange={(event) => handlePromptChange(event.target.value)}
            placeholder={promptPlaceholder}
            className={`w-full${showPromptError && isDetailVariant ? ' p-invalid' : ''}`}
            rows={isDetailVariant ? 1 : 3}
            disabled={isDetailVariant && !selectedAgentId}
          />
        </div>
      </div>

      <div
        className={
          isDetailVariant
            ? 'agent-detail-collaboration-form-actions'
            : 'form-actions'
        }
      >
        <Button
          type="button"
          label={t('cancel')}
          onClick={onCancel}
          className={
            isDetailVariant
              ? 'p-button-outlined agent-detail-discard-btn'
              : 'p-button-secondary'
          }
        />
        <Button
          type="button"
          label={editingCollaboration ? t('update') : t('add')}
          onClick={handleAdd}
          disabled={!isValid}
          className={
            isDetailVariant ? 'agent-detail-save-btn p-button' : undefined
          }
        />
      </div>
    </div>
  )
}
