import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { Tooltip } from 'primereact/tooltip'
import { useAppState } from '../../contexts/AppStateContext'
import { CustomAgent } from '../../types/Agent'
import { ToolConfig } from '../../types/Tool'
import { getLocalizedValue, iconMap } from '../../utils/agentHelpers'
import { DEFAULT_TEAMS_ALLOWED_OPERATIONS } from '../../utils/teamsRoutingHelpers'
import { ToolRequiredMark } from './ToolRequiredMark'
import { TeamsTeamIdGuide } from './TeamsTeamIdGuide'

interface TeamsToolSectionProps {
  config: ToolConfig
  availableAgents: CustomAgent[]
  isEditing: boolean
  onConfigChange: (key: string, value: string | boolean) => void
  onAllowedOperationsChange: (operations: string[]) => void
}

export const TeamsToolSection: React.FC<TeamsToolSectionProps> = ({
  config,
  availableAgents,
  isEditing,
  onConfigChange,
  onAllowedOperationsChange,
}) => {
  const { t } = useTranslation()
  const appState = useAppState()

  const agentOptions = useMemo(() => {
    const selectedAgentId = config.defaultInboundAgentId?.trim() ?? ''
    const enabledAgents = availableAgents.filter(
      (agent) => agent.enabled !== false
    )
    const selectedAgent = selectedAgentId
      ? availableAgents.find((agent) => agent.id === selectedAgentId)
      : undefined
    const agentsForOptions =
      selectedAgent &&
      !enabledAgents.some((agent) => agent.id === selectedAgent.id)
        ? [selectedAgent, ...enabledAgents]
        : enabledAgents

    return agentsForOptions
      .map((agent) => ({
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
      .sort((a, b) => a.sortName.localeCompare(b.sortName))
  }, [availableAgents, appState.contentLanguage, config.defaultInboundAgentId])

  const selectedDefaultInboundAgentId =
    config.defaultInboundAgentId?.trim() || null

  return (
    <>
      <div className="form-field">
        <label className="field-label">
          {t('team_id')}
          <ToolRequiredMark />
        </label>
        <InputText
          value={config.teamId ?? ''}
          onChange={(event) => onConfigChange('teamId', event.target.value)}
          className={`w-full${!config.teamId?.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_team_id')}
          disabled={isEditing}
        />
        <p className="tool-detail-section-description">
          {t(isEditing ? 'teams_team_id_hint_immutable' : 'teams_team_id_hint')}
        </p>
        {!isEditing ? <TeamsTeamIdGuide /> : null}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('tenant_id')}
          <ToolRequiredMark />
        </label>
        <InputText
          value={config.tenantId ?? ''}
          onChange={(event) => onConfigChange('tenantId', event.target.value)}
          className={`w-full${!config.tenantId?.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_tenant_id')}
          disabled={isEditing}
        />
        <p className="tool-detail-section-description">
          {t(
            isEditing
              ? 'teams_tenant_id_hint_immutable'
              : 'teams_tenant_id_hint'
          )}
        </p>
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('teams_default_inbound_agent')}
          <i
            className="pi pi-info-circle field-label-help-icon teams-default-inbound-agent-help"
            data-pr-tooltip={t('teams_default_inbound_agent_tooltip')}
            data-pr-position="top"
          />
        </label>
        <Tooltip target=".teams-default-inbound-agent-help" />
        <Dropdown
          value={selectedDefaultInboundAgentId}
          options={agentOptions}
          onChange={(event) =>
            onConfigChange('defaultInboundAgentId', event.value ?? '')
          }
          placeholder={t('select_an_option')}
          className="w-full"
          appendTo="self"
          filter
          filterBy="sortName"
          filterPlaceholder={t('search_agents')}
          showClear={!!selectedDefaultInboundAgentId}
        />
        <p className="tool-detail-section-description">
          {t('teams_default_inbound_agent_hint')}
        </p>
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('teams_allowed_operations')}
          <ToolRequiredMark />
        </label>
        <MultiSelect
          value={
            config.allowedOperations ?? [...DEFAULT_TEAMS_ALLOWED_OPERATIONS]
          }
          options={[...DEFAULT_TEAMS_ALLOWED_OPERATIONS].map((operation) => ({
            label: t(`teams_operation_${operation}`),
            value: operation,
          }))}
          onChange={(event) =>
            onAllowedOperationsChange((event.value as string[]) ?? [])
          }
          className={`w-full${
            (config.allowedOperations?.length ??
              DEFAULT_TEAMS_ALLOWED_OPERATIONS.length) === 0
              ? ' p-invalid'
              : ''
          }`}
          display="chip"
          appendTo="self"
        />
        <p className="tool-detail-section-description">
          {t('teams_allowed_operations_hint')}
        </p>
      </div>
    </>
  )
}
