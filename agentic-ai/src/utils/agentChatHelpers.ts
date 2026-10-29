import type { PatchOperation } from '../services/agentService'
import type { Trigger } from '../types/Agent'

export const CHAT_EMPLOYEE_SCOPE = 'employee'
export const CHAT_API_TRIGGER_TYPE = 'endpoint'

export type ChatInvokeGate = 'employee_scope' | 'api_trigger'

const normalizeToken = (value: string): string => value.trim().toLowerCase()

export const nextSessionId = (
  reset: boolean,
  stored: string | null
): string | null => (reset ? null : stored)

export const nextThinkingText = (
  current: string | null,
  content: string | null
): string | null => (content === null ? null : `${current ?? ''}${content}`)

export const nextAgentId = (
  current: string | null,
  enabledIds: readonly string[],
  hasUserMessage: boolean
): string | null => {
  if (current && enabledIds.includes(current)) {
    return current
  }
  if (hasUserMessage) {
    return current
  }
  return enabledIds[0] ?? null
}

export const CHAT_AGENT_QUERY_PARAM = 'agent'

export const nextAgentIdFromQuery = (
  current: string | null,
  requested: string | null,
  enabledIds: readonly string[],
  hasUserMessage: boolean
): string | null => {
  const requestedId = requested?.trim() ?? ''
  if (
    !current &&
    !hasUserMessage &&
    requestedId.length > 0 &&
    enabledIds.includes(requestedId)
  ) {
    return requestedId
  }
  return nextAgentId(current, enabledIds, hasUserMessage)
}

export const isCustomerOnlyRequiredScopes = (
  requiredScopes: readonly string[] | undefined
): boolean => {
  if (!requiredScopes || requiredScopes.length === 0) {
    return false
  }
  const normalized = requiredScopes.map(normalizeToken)
  return normalized.length === 1 && normalized[0] === 'customer'
}

export const isMissingApiTrigger = (
  triggers: readonly Pick<Trigger, 'type'>[] | undefined
): boolean => {
  if (!triggers || triggers.length === 0) {
    return true
  }
  return !triggers.some(
    (trigger) => normalizeToken(trigger.type) === CHAT_API_TRIGGER_TYPE
  )
}

export const getChatInvokeGates = (agent: {
  readonly requiredScopes?: readonly string[]
  readonly triggers?: readonly Pick<Trigger, 'type'>[]
}): ChatInvokeGate[] => {
  const gates: ChatInvokeGate[] = []
  if (isCustomerOnlyRequiredScopes(agent.requiredScopes)) {
    gates.push('employee_scope')
  }
  if (isMissingApiTrigger(agent.triggers)) {
    gates.push('api_trigger')
  }
  return gates
}

export const withEmployeeRequiredScope = (
  requiredScopes: readonly string[] | undefined
): string[] => {
  const current = requiredScopes ?? []
  if (current.some((scope) => normalizeToken(scope) === CHAT_EMPLOYEE_SCOPE)) {
    return [...current]
  }
  return [...current, CHAT_EMPLOYEE_SCOPE]
}

export const withApiEndpointTrigger = (
  triggers: readonly Trigger[] | undefined
): Trigger[] => {
  const current = triggers ?? []
  if (
    current.some(
      (trigger) => normalizeToken(trigger.type) === CHAT_API_TRIGGER_TYPE
    )
  ) {
    return [...current]
  }
  return [...current, { type: CHAT_API_TRIGGER_TYPE, config: null }]
}

export const buildChatInvokePatchOperations = (
  agent: {
    readonly requiredScopes?: readonly string[]
    readonly triggers?: readonly Trigger[]
  },
  gates: readonly ChatInvokeGate[]
): PatchOperation[] => {
  const patches: PatchOperation[] = []
  if (gates.includes('employee_scope')) {
    patches.push({
      op: 'REPLACE',
      path: '/requiredScopes',
      value: withEmployeeRequiredScope(agent.requiredScopes),
    })
  }
  if (gates.includes('api_trigger')) {
    patches.push({
      op: 'REPLACE',
      path: '/triggers',
      value: withApiEndpointTrigger(agent.triggers),
    })
  }
  return patches
}
