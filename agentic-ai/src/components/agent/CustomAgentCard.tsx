import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomAgent } from '../../types/Agent';
import { AgentCardBaseProps } from '../../types/common';
import { getLocalizedValue, iconMap } from '../../utils/agentHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import AgentCard from '../shared/AgentCard';

interface CustomAgentCardProps extends AgentCardBaseProps {
  agent: CustomAgent
  onConfigure: (agent: CustomAgent) => void
  onRemove: (agentId: string) => void
}

const CustomAgentCard = memo(({ 
  agent, 
  onToggleActive, 
  onConfigure, 
  onRemove 
}: CustomAgentCardProps) => {
  const { t, i18n } = useTranslation()
  
  const agentName = getLocalizedValue(agent.name, i18n.language)
  const agentDescription = getLocalizedValue(agent.description, i18n.language)

  const getAgentIcon = () => {
    if (agent.icon && iconMap[agent.icon]) {
      return <FontAwesomeIcon icon={iconMap[agent.icon]} />;
    }
    return <FontAwesomeIcon icon={faRobot} />;
  };

  return (
    <AgentCard
      id={agent.id}
      name={agentName}
      description={agentDescription}
      icon={getAgentIcon()}
      tags={agent.tags}
      enabled={agent.enabled}
      onToggleActive={onToggleActive}
      onClick={() => onConfigure(agent)}
      primaryActions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(agent)
        }
      ]}
      secondaryActions={[
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(agent.id),
          disabled: agent.enabled,
          title: agent.enabled ? t('cannot_delete_active_agent', 'Cannot delete active agent') : undefined
        }
      ]}
    />
  );
});

CustomAgentCard.displayName = 'CustomAgentCard';

export default CustomAgentCard; 