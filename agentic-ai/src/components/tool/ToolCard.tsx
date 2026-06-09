import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToolCardProps, PRODUCT_ENTITY_TYPE } from '../../types/Tool'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSlack, faMicrosoft } from '@fortawesome/free-brands-svg-icons'
import { faTools } from '@fortawesome/free-solid-svg-icons'
import BaseCard, { CardAction } from '../shared/BaseCard'
import { getToolTypeLabel } from '../../utils/toolHelpers'

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

  const getDescription = () => {
    const typeLabel = getToolTypeLabel(t, tool.type)

    if (tool.type === 'slack' || tool.type === 'teams') {
      const parts: string[] = []
      if (tool.config?.teamId) {
        parts.push(`${t('team_id')}: ${tool.config.teamId}`)
      }
      if (tool.config?.botToken) {
        parts.push(`${t('bot_token')}: ${'•'.repeat(8)}`)
      }
      return parts.length > 0
        ? parts.join('\n')
        : t('tool_type_tool', { type: typeLabel })
    }

    return t('tool_type_tool', { type: typeLabel })
  }

  const getActions = (): CardAction[] => {
    const actions: CardAction[] = [
      {
        icon: 'pi pi-cog',
        label: t('configure'),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          onConfigure(tool)
        },
        className: 'configure-button',
      },
    ]

    if (tool.type === 'rag_emporix' && onReindex) {
      const isProductEntityType =
        tool.config?.entityType === PRODUCT_ENTITY_TYPE
      actions.push({
        icon: 'pi pi-refresh',
        label: t('reindex'),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          onReindex(tool)
        },
        className: 'configure-button',
        disabled: !isProductEntityType,
        title: !isProductEntityType
          ? t('reindex_only_available_for_product')
          : undefined,
      })
    }

    actions.push({
      icon: 'pi pi-trash',
      label: t('remove'),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove(tool.id)
      },
      disabled: tool.enabled,
      title: tool.enabled ? t('cannot_delete_active_tool') : t('remove_tool'),
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
      badge={getToolTypeLabel(t, tool.type)}
      enabled={tool.enabled ?? true}
      onToggleActive={onToggleActive}
      actions={getActions()}
      onClick={() => onConfigure(tool)}
    />
  )
}

export default ToolCard
