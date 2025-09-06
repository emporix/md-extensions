import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToolCardProps } from '../../types/Tool';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import BaseCard from '../shared/BaseCard';

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

  const getDescription = () => {
    if (tool.type === 'slack' || tool.type === 'teams') {
      return (
        <>
          {tool.config.teamId && `Team ID: ${tool.config.teamId}`}
          {tool.config.teamId && tool.config.botToken && <br />}
          {tool.config.botToken && `Bot Token: ${'•'.repeat(8)}`}
          {!tool.config.teamId && !tool.config.botToken && `${getToolTypeLabel()} Tool`}
        </>
      );
    }
    return `${getToolTypeLabel()} Tool`;
  };

  return (
    <BaseCard
      icon={<FontAwesomeIcon icon={getToolIcon()} />}
      badge={getToolTypeLabel()}
      title={tool.name}
      description={getDescription()}
      primaryActions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(tool)
        }
      ]}
      secondaryActions={[
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(tool.id)
        }
      ]}
      onClick={() => onConfigure(tool)}
    />
  );
};

export default ToolCard;
