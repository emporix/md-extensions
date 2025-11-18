import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToolCardProps } from '../../types/Tool';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import BaseCard, { CardAction } from '../shared/BaseCard';

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onToggleActive,
  onConfigure,
  onRemove,
  onReindex,
}) => {
  const { t } = useTranslation()

  const getToolIcon = () => {
    switch (tool.type) {
      case 'slack':
        return faSlack
      case 'teams':
        return faMicrosoft
      default:
        return faTools
    }
  }

  const getToolTypeLabel = () => {
    switch (tool.type) {
      case 'slack':
        return 'Slack'
      case 'teams':
        return 'Microsoft Teams'
      case 'rag_emporix':
        return 'RAG Emporix'
      case 'rag_custom':
        return 'RAG Custom'
      default:
        return tool.type
    }
  }

  const getDescription = () => {
    if (tool.type === 'slack' || tool.type === 'teams') {
      const parts: string[] = [];
      if (tool.config?.teamId) {
        parts.push(`Team ID: ${tool.config?.teamId}`);
      }
      if (tool.config?.botToken) {
        parts.push(`Bot Token: ${'•'.repeat(8)}`);
      }
      return parts.length > 0 ? parts.join('\n') : `${getToolTypeLabel()} Tool`;
    }
    return `${getToolTypeLabel()} Tool`;
  };

  const getActions = (): CardAction[] => {
    const actions: CardAction[] = [
      {
        icon: 'pi pi-cog',
        label: t('configure'),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          onConfigure(tool)
        },
        className: 'configure-button'
      },
    ]

    // Add reindex button for rag_emporix tools
    if (tool.type === 'rag_emporix' && onReindex) {
      actions.push({
        icon: 'pi pi-refresh',
        label: t('reindex', 'Reindex'),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          onReindex(tool)
        },
        className: 'configure-button'
      })
    }

    // Add remove button
    actions.push({
      icon: 'pi pi-trash',
      label: t('remove', 'Remove'),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove(tool.id)
      },
      disabled: tool.enabled,
      title: tool.enabled
        ? t('cannot_delete_active_tool', 'Cannot delete active tool')
        : t('remove_tool', 'Remove tool'),
      className: 'remove-button',
    })

    return actions
  }

  return (
    <BaseCard
      id={tool.id}
      title={tool.name}
      description={getDescription()}
      icon={<FontAwesomeIcon icon={getToolIcon()} />}
      badge={getToolTypeLabel()}
      enabled={tool.enabled ?? true}
      onToggleActive={onToggleActive}
      actions={getActions()}
      onClick={() => onConfigure(tool)}
    />
  )
}

export default ToolCard;
