import { LocalizedString, CustomAgent } from '../types/Agent'
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
    provider: 'emporix_openai',
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
