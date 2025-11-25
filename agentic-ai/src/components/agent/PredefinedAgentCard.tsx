import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentTemplate } from '../../types/Agent'
import { AgentCardBaseProps } from '../../types/common'
import { getLocalizedValue, iconMap } from '../../utils/agentHelpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import AgentCard from './AgentCard'

interface PredefinedAgentCardProps extends AgentCardBaseProps {
  agent: AgentTemplate
  onAddAgent: (agentId: string) => void
}

const PredefinedAgentCard = memo(
  ({ agent, onAddAgent }: PredefinedAgentCardProps) => {
    const { t, i18n } = useTranslation()

    const agentName = getLocalizedValue(agent.name, i18n.language)
    const agentDescription = getLocalizedValue(agent.description, i18n.language)

    const getAgentIcon = () => {
      if (agent.icon && iconMap[agent.icon]) {
        return <FontAwesomeIcon icon={iconMap[agent.icon]} />
      }
      return <FontAwesomeIcon icon={faRobot} />
    }

    return (
      <AgentCard
        id={agent.id}
        name={agentName}
        description={agentDescription}
        icon={getAgentIcon()}
        tags={agent.tags}
        enabled={agent.enabled}
        className="predefined-agent-card"
        onClick={() => onAddAgent(agent.id)}
        showStatusDot={true}
        actions={[
          {
            icon: 'pi pi-plus',
            label: t('add_agent', 'Add Agent'),
            onClick: () => onAddAgent(agent.id),
            disabled: !agent.enabled,
            title: !agent.enabled
              ? t('template_not_enabled', 'This template is not enabled')
              : undefined,
            className: 'add-agent-button',
          },
        ]}
      />
    )
  }
)

PredefinedAgentCard.displayName = 'PredefinedAgentCard'

export default PredefinedAgentCard
