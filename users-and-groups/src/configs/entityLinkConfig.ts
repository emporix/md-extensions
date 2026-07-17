import { groupDetailPath, userDetailPath } from '../constants/paths'

type EntityPathBuilder = (entityId: string) => string

const ENTITY_LINK_PATHS: Record<string, EntityPathBuilder> = {
  employee: userDetailPath,
  group: groupDetailPath,
}

export const getEntityDetailPath = (
  entityType: string,
  entityId: string
): string | undefined => {
  if (!entityType || !entityId || entityType === 'unknown') {
    return undefined
  }

  const builder = ENTITY_LINK_PATHS[entityType.toLowerCase()]
  return builder ? builder(entityId) : undefined
}
