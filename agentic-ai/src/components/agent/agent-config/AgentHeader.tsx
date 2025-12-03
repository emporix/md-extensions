import React from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { iconMap, getLocalizedValue } from '../../../utils/agentHelpers'
import { LocalizedString } from '../../../types/Agent'
import { AppState } from '../../../types/common'

interface AgentHeaderProps {
  agentName: LocalizedString
  selectedIcon: string
  selectedTag: string | null
  onIconClick: () => void
  onTagClick: () => void
  appState: AppState
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  agentName,
  selectedIcon,
  selectedTag,
  onIconClick,
  onTagClick,
  appState,
}) => {
  const { t } = useTranslation()
  const agentDisplayName = getLocalizedValue(
    agentName,
    appState.contentLanguage
  )

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
            <h3 className="agent-config-name">{agentDisplayName}</h3>
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
