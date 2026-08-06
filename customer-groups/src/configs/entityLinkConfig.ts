import { groupDetailPath } from '../constants/paths'

type EntityPathBuilder = (entityId: string) => string

// Employee entities are intentionally unmapped: this remote has no user detail
// route, so changelog actors render as plain text instead of dead links.
const ENTITY_LINK_PATHS: Record<string, EntityPathBuilder> = {
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
