import type {
  ChangelogEntryPathChange,
  ChangelogEntryRelatedItem,
  ChangelogEntryType,
} from '@emporix/api-calls/next'
import type { ChangelogChangeTypeKey } from '../labels'

export const CHANGE_TYPE_KEY: Record<
  ChangelogEntryType,
  ChangelogChangeTypeKey
> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
}

export const getOtherRelatedItems = (
  related: ChangelogEntryRelatedItem[] | undefined,
  currentEntity: string,
  currentEntityId: string
): ChangelogEntryRelatedItem[] => {
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

export const isChangelogValueEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value === ''
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

export const formatChangelogValue = (value: unknown): string | null => {
  if (isChangelogValueEmpty(value)) {
    return null
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

export const filterMeaningfulChangelogPaths = (
  paths: Record<string, ChangelogEntryPathChange>
): Record<string, ChangelogEntryPathChange> => {
  return Object.entries(paths).reduce<Record<string, ChangelogEntryPathChange>>(
    (acc, [field, change]) => {
      if (
        isChangelogValueEmpty(change.before) &&
        isChangelogValueEmpty(change.after)
      ) {
        return acc
      }

      acc[field] = change
      return acc
    },
    {}
  )
}
