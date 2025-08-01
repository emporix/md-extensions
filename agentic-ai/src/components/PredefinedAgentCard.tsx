import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { AgentTemplate } from '../types/Agent';
import { AgentCardBaseProps } from '../types/common';
import { getAgentStatusLabel, getLocalizedValue, iconMap } from '../utils/agentHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

interface PredefinedAgentCardProps extends AgentCardBaseProps {
  agent: AgentTemplate
  onAddAgent: (agentId: string) => void
}

const PredefinedAgentCard = memo(({ 
  agent, 
  onToggleActive, 
  onAddAgent 
}: PredefinedAgentCardProps) => {
  const { t, i18n } = useTranslation()
  const [isActive, setIsActive] = useState(agent.enabled)
  
  const agentName = getLocalizedValue(agent.name, i18n.language)
  const agentDescription = getLocalizedValue(agent.description, i18n.language)

  const handleToggleActive = useCallback((enabled: boolean) => {
    setIsActive(enabled)
    onToggleActive(agent.id, enabled)
  }, [agent.id, onToggleActive])

  const cardHeader = (
    <div className="predefined-agent-card-header">
      <div className="agent-icon">
        {agent.icon && iconMap[agent.icon]
          ? <FontAwesomeIcon icon={iconMap[agent.icon]} />
          : <FontAwesomeIcon icon={faRobot} />}
      </div>
      <div className="agent-tags">
        {agent.tags && agent.tags.map(tag => (
          <Badge value={tag} key={tag} className="agent-tag-badge" />
        ))}
      </div>
    </div>
  )

  const cardFooter = (
    <div className="predefined-agent-card-footer">
      <div className="status-toggle">
        <InputSwitch 
          checked={isActive}
          onChange={(e) => handleToggleActive(e.value)}
          className="agent-switch"
          disabled
        />
        <span className="status-label">
          {getAgentStatusLabel(isActive, t)}
        </span>
      </div>
      
      <button
        className="add-agent-button"
        onClick={() => onAddAgent(agent.id)}
        disabled={!agent.enabled}
        title={!agent.enabled ? t('template_not_enabled', 'This template is not enabled') : undefined}
      >
        <i className="pi pi-plus"></i>
        {t('add_agent', 'Add Agent')}
      </button>
    </div>
  )

  return (
    <Card 
      className="predefined-agent-card"
      header={cardHeader}
      footer={cardFooter}
    >
      <div className="agent-content">
        <h3 className="agent-name">{agentName}</h3>
        <p className="agent-description">{agentDescription}</p>
      </div>
    </Card>
  );
});

PredefinedAgentCard.displayName = 'PredefinedAgentCard';

export default PredefinedAgentCard; 