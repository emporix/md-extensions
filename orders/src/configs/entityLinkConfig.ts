import { orderDetailPath } from '../constants/paths'

type EntityPathBuilder = (entityId: string) => string

// Only entities with an in-remote route are linked; everything else renders
// as plain text in the changelog instead of a dead link.
const ENTITY_LINK_PATHS: Record<string, EntityPathBuilder> = {
  order: orderDetailPath,
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
