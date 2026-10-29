export const CHAT_RECOMMENDATION_LIMIT = 5

const LABEL_MAX_LENGTH = 40

export type ChatRecommendation = {
  readonly icon: string
  readonly label: string
  readonly prompt: string
}

export type CommerceEventSchema = {
  readonly eventType: string
  readonly schema: unknown
}

type EventSubscriptionLike = {
  readonly event?: {
    readonly type?: string
    readonly eventSchema?: unknown
    readonly group?: {
      readonly en?: string
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stripFence = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('```')) {
    return trimmed
  }
  const withoutOpen = trimmed.replace(/^```(?:json)?\s*/i, '')
  return withoutOpen.replace(/\s*```$/, '').trim()
}

const clip = (value: string, max: number): string =>
  value.length <= max ? value : value.slice(0, max)

export const parseChatRecommendations = (
  raw: string
): readonly ChatRecommendation[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(raw))
  } catch {
    return []
  }
  if (!isRecord(parsed) || parsed.hasRecommendations === false) {
    return []
  }
  if (!Array.isArray(parsed.recommendations)) {
    return []
  }

  const items: ChatRecommendation[] = []
  for (const entry of parsed.recommendations) {
    if (items.length >= CHAT_RECOMMENDATION_LIMIT) {
      break
    }
    if (!isRecord(entry)) {
      continue
    }
    const label = typeof entry.label === 'string' ? entry.label.trim() : ''
    const prompt = typeof entry.prompt === 'string' ? entry.prompt.trim() : ''
    if (!label || !prompt) {
      continue
    }
    const icon = typeof entry.icon === 'string' ? entry.icon.trim() : ''
    items.push({ icon, label: clip(label, LABEL_MAX_LENGTH), prompt })
  }
  return items
}

const slug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const stemCommerceEventKey = (value: string): string =>
  slug(value)
    .replace(/-webhook(?=-|$)/g, '')
    .replace(/-v\d+(?=-|$)/g, '')
    .replace(/cancelled|canceled/g, 'cancel')
    .replace(/created/g, 'create')
    .replace(/updated/g, 'update')
    .replace(/changed/g, 'update')
    .replace(/change/g, 'update')
    .replace(/deleted/g, 'delete')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

const commerceGroupMatches = (
  agentEvent: string,
  groupName: string | undefined
): boolean => {
  if (!groupName?.trim()) {
    return false
  }
  const groupSlug = slug(groupName)
  const dot = agentEvent.indexOf('.')
  const domain = slug(dot < 0 ? agentEvent : agentEvent.slice(0, dot))
  if (
    domain === groupSlug ||
    domain.replace(/-v\d+$/, '') === groupSlug ||
    domain.replace(/s$/, '') === groupSlug
  ) {
    return true
  }
  const detail = slug(dot < 0 ? '' : agentEvent.slice(dot + 1))
  return detail === groupSlug || detail.startsWith(`${groupSlug}-`)
}

const commerceEventKeys = (
  agentEvent: string
): { readonly detail: string; readonly stripped: string } => {
  const dot = agentEvent.indexOf('.')
  const domain = slug(dot < 0 ? agentEvent : agentEvent.slice(0, dot))
  const detail = slug(dot < 0 ? '' : agentEvent.slice(dot + 1))
  const stripped = detail.startsWith(`${domain}-`)
    ? detail.slice(domain.length + 1)
    : detail
  return {
    detail: stemCommerceEventKey(detail),
    stripped: stemCommerceEventKey(stripped),
  }
}

const subscriptionMatchesAgentEvent = (
  agentEvent: string,
  subscription: EventSubscriptionLike
): boolean => {
  const subscriptionType = subscription.event?.type?.trim() ?? ''
  if (!subscriptionType) {
    return false
  }
  if (subscriptionType.toLowerCase() === agentEvent.trim().toLowerCase()) {
    return true
  }
  if (!commerceGroupMatches(agentEvent, subscription.event?.group?.en)) {
    return false
  }
  const keys = commerceEventKeys(agentEvent)
  const subscriptionKey = stemCommerceEventKey(subscriptionType)
  return keys.detail === subscriptionKey || keys.stripped === subscriptionKey
}

export const selectCommerceEventSchemas = (
  subscriptions: readonly EventSubscriptionLike[],
  eventTypes: readonly string[]
): CommerceEventSchema[] => {
  const schemas: CommerceEventSchema[] = []
  for (const eventType of eventTypes) {
    const agentEvent = eventType.trim()
    if (!agentEvent) {
      continue
    }
    const match = subscriptions.find(
      (subscription) =>
        subscription.event?.eventSchema != null &&
        subscriptionMatchesAgentEvent(agentEvent, subscription)
    )
    if (!match?.event?.type || match.event.eventSchema == null) {
      continue
    }
    schemas.push({
      eventType: match.event.type,
      schema: match.event.eventSchema,
    })
  }
  return schemas
}

export const buildRecommendationMessage = (input: {
  readonly agentName: string
  readonly agentDescription: string
  readonly agentPrompt: string
  readonly templatePrompt?: string
  readonly eventSchemas?: readonly CommerceEventSchema[]
}): string => {
  const templatePrompt = input.templatePrompt?.trim() ?? ''
  const lines = [
    `Target agent name: ${input.agentName.trim() || '(unknown)'}`,
    `Target agent description: ${input.agentDescription.trim() || '(none)'}`,
    'Target agent prompt:',
    input.agentPrompt.trim() || '(none)',
  ]
  if (templatePrompt) {
    lines.push('Target agent template prompt:', templatePrompt)
  }
  const eventSchemas = input.eventSchemas ?? []
  if (eventSchemas.length > 0) {
    lines.push('Commerce event subscriptions:')
    for (const eventSchema of eventSchemas) {
      lines.push(`Event: ${eventSchema.eventType}`, 'Schema:')
      lines.push(JSON.stringify(eventSchema.schema))
    }
  }

  return lines.join('\n')
}
