import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import { CustomAgent } from '../types/Agent';
import { AgentCardBaseProps } from '../types/common';
import { getAgentStatusLabel, getLocalizedValue, iconMap } from '../utils/agentHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { Badge } from 'primereact/badge';

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
  const [isActive, setIsActive] = useState(agent.enabled)
  const [isToggling, setIsToggling] = useState(false)
  
  const agentName = getLocalizedValue(agent.name, i18n.language)
  const agentDescription = getLocalizedValue(agent.description, i18n.language)

  const handleToggleActive = useCallback(async (enabled: boolean) => {
    setIsToggling(true)
    try {
      setIsActive(enabled)
      await onToggleActive(agent.id, enabled)
    } catch (error) {
      // Revert the local state if the API call fails
      setIsActive(!enabled)
      console.error('Failed to toggle agent status:', error)
    } finally {
      setIsToggling(false)
    }
  }, [agent.id, onToggleActive])

  const cardHeader = (
    <div className="custom-agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
    <div className="custom-agent-card-footer">
      <div className="top-row">
        <button 
          className="text-button configure-button" 
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(agent);
          }}
        >
          <i className="pi pi-cog"></i>
          {t('configure')}
        </button>
      </div>
      
      <div className="bottom-row">
        <div className="status-toggle" onClick={(e) => e.stopPropagation()}>
          <InputSwitch 
            checked={isActive}
            onChange={(e) => {
              handleToggleActive(e.value);
            }}
            className="agent-switch"
            disabled={isToggling}
          />
          <span className="status-label">
            {isToggling ? t('updating', 'Updating...') : getAgentStatusLabel(isActive, t)}
          </span>
        </div>
        
        <button 
          className="text-button remove-button" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(agent.id);
          }}
          disabled={isActive}
          title={isActive ? t('cannot_delete_active_agent', 'Cannot delete active agent') : undefined}
        >
          <i className="pi pi-trash"></i>
          {t('remove', 'Remove')}
        </button>
      </div>
    </div>
  )

  return (
    <Card 
      className="custom-agent-card"
      header={cardHeader}
      footer={cardFooter}
      onClick={() => onConfigure(agent)}
      style={{ cursor: 'pointer' }}
    >
      <div className="agent-content">
        <h3 className="agent-name">{agentName}</h3>
        <p className="agent-description">{agentDescription}</p>
      </div>
    </Card>
  );
});

CustomAgentCard.displayName = 'CustomAgentCard';

export default CustomAgentCard; 