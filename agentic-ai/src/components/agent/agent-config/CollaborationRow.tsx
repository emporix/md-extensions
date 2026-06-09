import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { AgentCollaboration } from '../../../types/Agent'
import { isCollaborationPromptMissing } from '../../../utils/agentCollaborationHelpers'

interface CollaborationRowProps {
  collaboration: AgentCollaboration
  index: number
  agentOptions: Array<{
    label: React.ReactNode
    value: string
    sortName: string
  }>
  onUpdate: (index: number, patch: Partial<AgentCollaboration>) => void
  onDelete: (index: number) => void
  autoFocus?: boolean
}

export const CollaborationRow: React.FC<CollaborationRowProps> = ({
  collaboration,
  index,
  agentOptions,
  onUpdate,
  onDelete,
  autoFocus = false,
}) => {
  const { t } = useTranslation()
  const selectedAgentId = collaboration.agentId || null

  return (
    <div className="agent-detail-collaboration-row">
      <div className="agent-detail-collaboration-row-fields">
        <div className="form-field">
          <label className="field-label">{t('agent')}</label>
          <Dropdown
            value={selectedAgentId}
            options={agentOptions}
            onChange={(event) =>
              onUpdate(index, { agentId: event.value ?? '' })
            }
            placeholder={t('select_an_option')}
            className="w-full"
            appendTo="self"
            filter
            filterBy="sortName"
            filterPlaceholder={t('search_agents')}
            autoFocus={autoFocus}
          />
        </div>

        <div className="form-field">
          <label className="field-label">{t('collaboration_prompt')}</label>
          <InputTextarea
            value={collaboration.description}
            onChange={(event) =>
              onUpdate(index, { description: event.target.value })
            }
            placeholder={
              selectedAgentId
                ? t('collaboration_prompt_placeholder')
                : t('collaboration_please_select')
            }
            className={`w-full${
              isCollaborationPromptMissing(
                collaboration.agentId,
                collaboration.description
              )
                ? ' p-invalid'
                : ''
            }`}
            rows={3}
          />
        </div>
      </div>

      <div className="agent-detail-collaboration-actions">
        <button
          type="button"
          className="agent-detail-collaboration-action-btn agent-detail-collaboration-action-btn--delete"
          aria-label={t('delete')}
          onClick={() => onDelete(index)}
        >
          <i className="pi pi-trash" />
        </button>
      </div>
    </div>
  )
}
