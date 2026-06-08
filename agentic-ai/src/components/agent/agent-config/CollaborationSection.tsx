import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { AgentCollaboration, CustomAgent } from '../../../types/Agent'
import { AppState } from '../../../types/common'
import { getLocalizedValue } from '../../../utils/agentHelpers'
import { iconMap } from '../../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  filterCollaborationAgentOptions,
  getUsedCollaborationAgentIdsExcludingRow,
} from '../../../utils/agentCollaborationHelpers'
import { CollaborationRow } from './CollaborationRow'

interface CollaborationSectionProps {
  collaborations: AgentCollaboration[]
  onChange: (collaborations: AgentCollaboration[]) => void
  availableAgents: CustomAgent[]
  currentAgentId?: string
  currentAgentType?: string
  appState: AppState
}

export const CollaborationSection: React.FC<CollaborationSectionProps> = ({
  collaborations,
  onChange,
  availableAgents,
  currentAgentId,
  currentAgentType,
  appState,
}) => {
  const { t } = useTranslation()

  const rows = collaborations

  const buildAgentOptions = useCallback(
    (rowIndex: number) => {
      const selectedAgentId = rows[rowIndex]?.agentId.trim() ?? ''
      const filteredAgents = filterCollaborationAgentOptions(
        availableAgents,
        currentAgentId,
        getUsedCollaborationAgentIdsExcludingRow(rows, rowIndex),
        currentAgentType,
        undefined,
        appState.contentLanguage
      )

      const selectedAgent = selectedAgentId
        ? availableAgents.find((agent) => agent.id === selectedAgentId)
        : undefined

      const agentsForOptions =
        selectedAgent &&
        !filteredAgents.some((agent) => agent.id === selectedAgent.id)
          ? [selectedAgent, ...filteredAgents]
          : filteredAgents

      return agentsForOptions.map((agent) => ({
        label: (
          <div className="agent-option">
            <FontAwesomeIcon
              icon={iconMap[agent.icon ?? 'robot'] ?? iconMap.robot}
              className="agent-option-icon"
            />
            <span>
              {getLocalizedValue(agent.name, appState.contentLanguage)}
            </span>
          </div>
        ),
        value: agent.id,
        sortName: getLocalizedValue(agent.name, appState.contentLanguage),
      }))
    },
    [
      availableAgents,
      currentAgentId,
      currentAgentType,
      rows,
      appState.contentLanguage,
    ]
  )

  const updateRow = useCallback(
    (index: number, patch: Partial<AgentCollaboration>) => {
      const nextRows = rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
      onChange(nextRows)
    },
    [onChange, rows]
  )

  const handleDeleteRow = useCallback(
    (index: number) => {
      onChange(rows.filter((_, rowIndex) => rowIndex !== index))
    },
    [onChange, rows]
  )

  const handleAddRow = useCallback(() => {
    onChange([...rows, { agentId: '', description: '' }])
  }, [onChange, rows])

  return (
    <div className="agent-detail-collaboration-tab">
      <h2 className="agent-detail-section-title">
        {t('collaboration_listings')}
      </h2>

      <div className="agent-detail-collaboration-list">
        {rows.map((collaboration, index) => {
          const agentOptions = buildAgentOptions(index)

          return (
            <CollaborationRow
              key={`collaboration-row-${index}`}
              collaboration={collaboration}
              index={index}
              agentOptions={agentOptions}
              onUpdate={updateRow}
              onDelete={handleDeleteRow}
            />
          )
        })}

        <Button
          type="button"
          icon="pi pi-plus"
          className="p-button agent-detail-collaboration-add-btn agent-filter-dsl-add-icon-btn"
          aria-label={t('add_collaboration')}
          onClick={handleAddRow}
        />
      </div>
    </div>
  )
}
