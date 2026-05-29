import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { AgentCollaboration, CustomAgent } from '../../../types/Agent'
import { AppState } from '../../../types/common'
import { getLocalizedValue } from '../../../utils/agentHelpers'
import { iconMap } from '../../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  filterCollaborationAgentOptions,
  getCollaborationRows,
  getUsedCollaborationAgentIdsExcludingRow,
  isCollaborationPromptMissing,
  isEmptyCollaborationRow,
} from '../../../utils/agentCollaborationHelpers'

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

  const rows = useMemo(
    () => getCollaborationRows(collaborations),
    [collaborations]
  )

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
      const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
      onChange(
        nextRows.length > 0 ? nextRows : [{ agentId: '', description: '' }]
      )
    },
    [onChange, rows]
  )

  return (
    <div className="agent-detail-collaboration-tab">
      <h2 className="agent-detail-section-title">
        {t('collaboration_listings')}
      </h2>

      <div className="agent-detail-collaboration-list">
        {rows.map((collaboration, index) => {
          const agentOptions = buildAgentOptions(index)
          const selectedAgentId = collaboration.agentId || null
          const isPlaceholderRow =
            index === rows.length - 1 &&
            isEmptyCollaborationRow(collaboration) &&
            (rows.length === 1 || Boolean(rows[index - 1]?.agentId.trim()))

          return (
            <div
              className="agent-detail-collaboration-row"
              key={`collaboration-row-${index}`}
            >
              <div className="agent-detail-collaboration-row-fields">
                <div className="form-field">
                  <label className="field-label">{t('agent')}</label>
                  <Dropdown
                    value={selectedAgentId}
                    options={agentOptions}
                    onChange={(event) =>
                      updateRow(index, { agentId: event.value ?? '' })
                    }
                    placeholder={t('select_an_option')}
                    className="w-full"
                    appendTo="self"
                    filter
                    filterBy="sortName"
                    filterPlaceholder={t('search_agents')}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">
                    {t('collaboration_prompt')}
                  </label>
                  <InputTextarea
                    value={collaboration.description}
                    onChange={(event) =>
                      updateRow(index, { description: event.target.value })
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

              {!isPlaceholderRow && (
                <div className="agent-detail-collaboration-actions">
                  <button
                    type="button"
                    className="agent-detail-collaboration-action-btn agent-detail-collaboration-action-btn--delete"
                    aria-label={t('delete')}
                    onClick={() => handleDeleteRow(index)}
                  >
                    <i className="pi pi-trash" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
