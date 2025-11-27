import React from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCollaboration } from '../../../types/Agent'
import { CustomAgent } from '../../../types/Agent'
import { AgentCollaborationForm } from './AgentCollaborationForm'
import { getLocalizedValue } from '../../../utils/agentHelpers'
import { iconMap } from '../../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppState } from '../../../types/common'

interface AgentCollaborationListProps {
  collaborations: AgentCollaboration[]
  onDelete: (index: number) => void
  onEdit: (index: number, collaboration: AgentCollaboration) => void
  onUpdate: (index: number, collaboration: AgentCollaboration) => void
  onCancelEdit: () => void
  editingIndex?: number
  availableAgents: CustomAgent[]
  currentAgentType?: string
  appState: AppState
}

export const AgentCollaborationList: React.FC<AgentCollaborationListProps> = ({
  collaborations,
  onDelete,
  onEdit,
  onUpdate,
  onCancelEdit,
  editingIndex,
  availableAgents,
  currentAgentType,
  appState,
}) => {
  const { t } = useTranslation()

  if (collaborations.length === 0) {
    return null
  }

  const getAgentDisplayInfo = (agentId: string) => {
    const agent = availableAgents.find((a) => a.id === agentId)
    if (!agent) {
      return { name: agentId, icon: 'robot' }
    }
    return {
      name: getLocalizedValue(agent.name, appState.contentLanguage),
      icon: agent.icon || 'robot',
    }
  }

  return (
    <div className="agent-collaboration-list">
      {collaborations.map((collaboration, idx) => (
        <div className="agent-collaboration-row" key={idx}>
          {editingIndex === idx ? (
            <AgentCollaborationForm
              onAdd={(updatedCollaboration: AgentCollaboration) =>
                onUpdate(idx, updatedCollaboration)
              }
              onCancel={onCancelEdit}
              availableAgents={availableAgents}
              editingCollaboration={collaboration}
              currentAgentType={currentAgentType}
              appState={appState}
            />
          ) : (
            <>
              <div className="agent-collaboration-row-top">
                <div className="agent-collaboration-info">
                  <div className="agent-collaboration-agent">
                    <FontAwesomeIcon
                      icon={
                        iconMap[
                          getAgentDisplayInfo(collaboration.agentId).icon
                        ] || iconMap.robot
                      }
                      className="agent-collaboration-icon"
                    />
                    <span className="agent-collaboration-name">
                      {getAgentDisplayInfo(collaboration.agentId).name}
                    </span>
                  </div>
                </div>
                <div className="agent-collaboration-actions">
                  <button
                    className="agent-collaboration-edit-btn"
                    type="button"
                    aria-label={t('edit', 'Edit')}
                    onClick={() => onEdit(idx, collaboration)}
                  >
                    <i className="pi pi-pencil"></i>
                  </button>
                  <button
                    className="agent-collaboration-delete-btn"
                    type="button"
                    aria-label={t('delete', 'Delete')}
                    onClick={() => onDelete(idx)}
                  >
                    <i className="pi pi-trash"></i>
                  </button>
                </div>
              </div>
              <div className="agent-collaboration-divider" />
              <div className="agent-collaboration-details">
                <div className="agent-collaboration-description">
                  {collaboration.description}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
