import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToolCardProps } from '../../types/Tool';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import BaseCard from '../shared/BaseCard';

const ToolCard: React.FC<ToolCardProps> = ({ tool, onToggleActive, onConfigure, onRemove }) => {
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
      const parts: string[] = [];
      if (tool.config.teamId) {
        parts.push(`Team ID: ${tool.config.teamId}`);
      }
      if (tool.config.botToken) {
        parts.push(`Bot Token: ${'•'.repeat(8)}`);
      }
      return parts.length > 0 ? parts.join('\n') : `${getToolTypeLabel()} Tool`;
    }
    return `${getToolTypeLabel()} Tool`;
  };

  return (
    <BaseCard
      id={tool.id}
      title={tool.name}
      description={getDescription()}
      icon={<FontAwesomeIcon icon={getToolIcon()} />}
      badge={getToolTypeLabel()}
      enabled={tool.enabled ?? true}
      onToggleActive={onToggleActive}
      actions={[
        {
          icon: 'pi pi-cog',
          label: t('configure'),
          onClick: () => onConfigure(tool),
          className: 'configure-button'
        },
        {
          icon: 'pi pi-trash',
          label: t('remove', 'Remove'),
          onClick: () => onRemove(tool.id),
          disabled: tool.enabled,
          title: tool.enabled ? t('cannot_delete_active_tool', 'Cannot delete active tool') : undefined,
          className: 'remove-button'
        }
      ]}
      onClick={() => onConfigure(tool)}
    />
  );
};

export default ToolCard;
