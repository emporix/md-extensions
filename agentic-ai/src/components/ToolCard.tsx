import React from 'react';
import { Card } from 'primereact/card';
import { useTranslation } from 'react-i18next';
import { ToolCardProps } from '../types/Tool';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { faTools } from '@fortawesome/free-solid-svg-icons';

const ToolCard: React.FC<ToolCardProps> = ({ tool, onConfigure, onRemove }) => {
  const { t } = useTranslation();

  const getToolIcon = () => {
    switch (tool.type) {
      case 'slack':
        return faSlack;
      case 'teams':
        return faMicrosoft;
      default:
        return faTools;
    }
  };

  const getToolTypeLabel = () => {
    switch (tool.type) {
      case 'slack':
        return 'Slack';
      case 'teams':
        return 'Microsoft Teams';
      default:
        return tool.type;
    }
  };

  const cardHeader = (
    <div className="custom-agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="agent-icon">
        <FontAwesomeIcon icon={getToolIcon()} />
      </div>
      <div className="agent-tags">
        <span className="tool-type-badge">{getToolTypeLabel()}</span>
      </div>
    </div>
  );

  const cardFooter = (
    <div className="custom-agent-card-footer">
      <div className="top-row">
        <button 
          className="text-button configure-button" 
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(tool);
          }}
        >
          <i className="pi pi-cog"></i>
          {t('configure')}
        </button>
      </div>
      
      <div className="bottom-row">
        <div style={{ flex: 1 }}></div>
        <button 
          className="text-button remove-button" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tool.id);
          }}
        >
          <i className="pi pi-trash"></i>
          {t('remove', 'Remove')}
        </button>
      </div>
    </div>
  );

  return (
    <Card 
      className="custom-agent-card" 
      header={cardHeader} 
      footer={cardFooter}
      onClick={() => onConfigure(tool)}
      style={{ cursor: 'pointer' }}
    >
      <div className="agent-content">
        <h3 className="agent-name">{tool.name}</h3>
        <p className="agent-description">
          {tool.type === 'slack' && (
            <>
              {tool.config.teamId && `Team ID: ${tool.config.teamId}`}
              {tool.config.teamId && tool.config.botToken && <br />}
              {tool.config.botToken && `Bot Token: ${'•'.repeat(8)}`}
              {!tool.config.teamId && !tool.config.botToken && `${getToolTypeLabel()} Tool`}
            </>
          )}
          {tool.type === 'teams' && (
            <>
              {tool.config.teamId && `Team ID: ${tool.config.teamId}`}
              {tool.config.teamId && tool.config.botToken && <br />}
              {tool.config.botToken && `Bot Token: ${'•'.repeat(8)}`}
              {!tool.config.teamId && !tool.config.botToken && `${getToolTypeLabel()} Tool`}
            </>
          )}
          {tool.type !== 'slack' && tool.type !== 'teams' && `${getToolTypeLabel()} Tool`}
        </p>
      </div>
    </Card>
  );
};

export default ToolCard;
