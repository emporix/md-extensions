import React from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { iconMap } from '../../../utils/agentHelpers'

interface AgentHeaderProps {
  agentName: string
  selectedIcon: string
  selectedTag: string | null
  onIconClick: () => void
  onTagClick: () => void
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  agentName,
  selectedIcon,
  selectedTag,
  onIconClick,
  onTagClick,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="agent-config-header">
        <h2 className="panel-title">
          {t('agent_config_panel.title', 'Agent Configuration')}
        </h2>
      </div>

      <div className="agent-config-icon-section">
        <div className="agent-config-icon-row">
          <div
            className="agent-icon"
            style={{ cursor: 'pointer' }}
            onClick={onIconClick}
          >
            {selectedIcon && iconMap[selectedIcon] ? (
              <FontAwesomeIcon icon={iconMap[selectedIcon]} />
            ) : (
              <FontAwesomeIcon icon={faRobot} />
            )}
          </div>
          <div className="agent-config-name-block">
            <h3 className="agent-config-name">{agentName}</h3>
          </div>
          <div
            className="agent-tag-selector"
            style={{ cursor: 'pointer' }}
            onClick={onTagClick}
          >
            {selectedTag ? (
              <span className="agent-tag-display">{selectedTag}</span>
            ) : (
              <span className="agent-tag-placeholder">
                {t('select_tag', 'Select Tag')}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
