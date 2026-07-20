import type { ChangelogRelatedItem } from '../../models/Changelog.model'
import { ChangelogChangeType } from './changelog.helpers'

export const getOtherRelatedItems = (
  related: ChangelogRelatedItem[] | undefined,
  currentEntity: string,
  currentEntityId: string
): ChangelogRelatedItem[] => {
  if (!related?.length) {
    return []
  }

  const normalizedCurrentEntity = currentEntity.toLowerCase()

  return related.filter(
    (item) =>
      item.entity.toLowerCase() !== normalizedCurrentEntity ||
      item.entityId !== currentEntityId
  )
}

export const buildRelatedEntityBadgeLabel = (
  rootEntityLabel: string,
  otherRelatedEntityLabel?: string
): string => {
  if (!otherRelatedEntityLabel) {
    return rootEntityLabel
  }

  return `${rootEntityLabel} - ${otherRelatedEntityLabel}`
}

export const getChangeTypeKey = (type: string): string => {
  return ChangelogChangeType.toUi(type)
}

export const formatChangelogValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
