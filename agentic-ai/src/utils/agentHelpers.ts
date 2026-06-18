import { LocalizedString, CustomAgent, LlmProvider } from '../types/Agent'
import { AVAILABLE_TAGS } from './constants'
import {
  faHeadset,
  faUser,
  faCog,
  faRobot,
  faDollarSign,
  faShoppingCart,
  faChartLine,
  faWrench,
  faEnvelope,
  faPhone,
  faShieldAlt,
  faBolt,
  faBullseye,
  faSearch,
  faClipboard,
  faRocket,
  faLightbulb,
  faPalette,
  faChartBar,
  faLock,
  faNetworkWired,
  faMobile,
} from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface AgentTagOption {
  label: string
  value: string
}

/**
 * Build the tag options for the agent tag selector.
 *
 * - Predefined AVAILABLE_TAGS are always offered.
 * - Matching against the predefined list is case-insensitive, so a selected tag
 *   that only differs by casing reuses its predefined slot (keeping the casing
 *   the agent was saved with) instead of creating a duplicate option.
 * - Selected tags that are not part of the predefined list are appended so they
 *   are still displayed as their own value.
 */
export const getAgentTagOptions = (
  selectedTags: string[] | undefined | null
): AgentTagOption[] => {
  const selected = selectedTags ?? []
  const selectedByLowercase = new Map<string, string>()

  for (const tag of selected) {
    const trimmed = tag?.trim()
    if (trimmed) {
      selectedByLowercase.set(trimmed.toLowerCase(), trimmed)
    }
  }

  const usedLowercase = new Set<string>()
  const options: AgentTagOption[] = []

  for (const availableTag of AVAILABLE_TAGS) {
    const lower = availableTag.toLowerCase()
    const label = selectedByLowercase.get(lower) ?? availableTag
    options.push({ label, value: label })
    usedLowercase.add(lower)
  }

  for (const tag of selected) {
    const trimmed = tag?.trim()
    if (!trimmed) {
      continue
    }

    const lower = trimmed.toLowerCase()
    if (!usedLowercase.has(lower)) {
      usedLowercase.add(lower)
      options.push({ label: trimmed, value: trimmed })
    }
  }

  return options
}

export const getAgentStatusLabel = (
  enabled: boolean,
  t: (key: string) => string
): string => {
  return enabled ? t('active') : t('inactive')
}

/**
 * Extract localized string value, falling back to English if the current language is not available
 */
export function getLocalizedValue(
  localizedString: LocalizedString,
  language: string = 'en'
): string {
  if (localizedString && hasAnyLocalizedValue(localizedString)) {
    return (
      localizedString[language] ||
      localizedString.en ||
      Object.values(localizedString)[0] ||
      ''
    )
  }
  return ''
}

export const hasAnyLocalizedValue = (
  localizedString: LocalizedString
): boolean => {
  return Object.values(localizedString).some((value) => value.trim().length > 0)
}

/**
 * Shared icon map for all agent components
 */
export const cleanAgentForConfig = (agent: CustomAgent): CustomAgent => {
  return {
    ...agent,
    id: agent.id || '',
    name: agent.name,
    description: agent.description,
    userPrompt: agent.userPrompt || '',
    triggers: agent.triggers || [{ type: 'endpoint', config: null }],
    llmConfig: agent.llmConfig || {
      model: '',
      temperature: 0,
      maxTokens: 0,
      provider: 'emporix_openai',
      additionalParams: null,
    },
    mcpServers: agent.mcpServers || [],
    nativeTools: agent.nativeTools || [],
    agentCollaborations: agent.agentCollaborations || [],
    maxRecursionLimit: agent.maxRecursionLimit || 20,
    enableMemory: agent.enableMemory !== undefined ? agent.enableMemory : true,
    enabled: agent.enabled || false,
    metadata: agent.metadata || {
      version: 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      schema: null,
      mixins: {},
    },
  }
}

export const createEmptyAgent = (language: string = 'en'): CustomAgent => ({
  id: '',
  name: { [language]: '' },
  description: { [language]: '' },
  userPrompt: '',
  triggers: [{ type: 'endpoint', config: null }],
  llmConfig: {
    model: '',
    temperature: 0,
    maxTokens: 0,
    provider: LlmProvider.EMPORIX_OPENAI,
    additionalParams: null,
  },
  mcpServers: [],
  nativeTools: [],
  agentCollaborations: [],
  maxRecursionLimit: 20,
  enableMemory: true,
  enabled: true,
  metadata: {
    version: 0,
    createdAt: '',
    modifiedAt: '',
    schema: null,
    mixins: {},
  },
  icon: '',
  tags: [],
  type: 'custom',
})

export const iconMap: Record<string, IconDefinition> = {
  headset: faHeadset,
  user: faUser,
  cog: faCog,
  robot: faRobot,
  cash: faDollarSign,
  cart: faShoppingCart,
  chart: faChartLine,
  tools: faWrench,
  email: faEnvelope,
  phone: faPhone,
  shield: faShieldAlt,
  lightning: faBolt,
  target: faBullseye,
  search: faSearch,
  clipboard: faClipboard,
  rocket: faRocket,
  lightbulb: faLightbulb,
  creative: faPalette,
  growth: faChartBar,
  lock: faLock,
  network: faNetworkWired,
  mobile: faMobile,
}
