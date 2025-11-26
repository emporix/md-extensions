import React from 'react'
import { Badge } from 'primereact/badge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import BaseCard, { CardAction } from '../shared/BaseCard'

export interface AgentCardProps {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
  tags?: string[]
  enabled: boolean
  className?: string
  actions?: CardAction[]
  onToggleActive?: (id: string, enabled: boolean) => void | Promise<void>
  onClick?: () => void
  switchDisabled?: boolean
  children?: React.ReactNode
  showStatusDot?: boolean
}

const AgentCard: React.FC<AgentCardProps> = ({
  id,
  name,
  description,
  icon,
  tags = [],
  enabled,
  className = 'custom-agent-card',
  actions = [],
  onToggleActive,
  onClick,
  switchDisabled = false,
  children,
  showStatusDot = false,
}) => {
  // Render tags as Badges for agent-specific styling
  const renderTagBadges = () => {
    if (tags.length === 0) return null

    return (
      <div className="agent-tags">
        {tags.map((tag) => (
          <Badge value={tag} key={tag} className="agent-tag-badge" />
        ))}
      </div>
    )
  }

  return (
    <BaseCard
      id={id}
      title={name}
      description={description}
      icon={icon || <FontAwesomeIcon icon={faRobot} />}
      enabled={enabled}
      className={className}
      actions={actions}
      onToggleActive={onToggleActive}
      onClick={onClick}
      switchDisabled={switchDisabled}
      contentBadges={renderTagBadges()}
      showStatusDot={showStatusDot}
    >
      {children}
    </BaseCard>
  )
}

export default AgentCard
