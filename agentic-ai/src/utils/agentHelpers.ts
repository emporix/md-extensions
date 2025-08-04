import { LocalizedString, CustomAgent } from '../types/Agent'
import { 
  faHeadset, faUser, faCog, faRobot, faDollarSign, faShoppingCart, 
  faChartLine, faWrench, faEnvelope, faPhone, faShieldAlt, faBolt,
  faBullseye, faSearch, faClipboard, faRocket, faLightbulb, faPalette,
  faChartBar, faLock, faNetworkWired, faMobile
} from '@fortawesome/free-solid-svg-icons'

export const getAgentStatusLabel = (enabled: boolean, t: (key: string) => string): string => {
  return enabled ? t('active') : t('inactive')
}

/**
 * Extract localized string value, falling back to English if the current language is not available
 */
export function getLocalizedValue(localizedString: LocalizedString | string, language: string = 'en'): string {
  if (typeof localizedString === 'string') {
    return localizedString
  }
  
  if (localizedString && typeof localizedString === 'object') {
    return localizedString[language] || localizedString.en || ''
  }
  
  return ''
}

/**
 * Shared icon map for all agent components
 */
export const cleanAgentForConfig = (agent: CustomAgent, language: string = 'en'): CustomAgent => {
  return {
    ...agent,
    id: agent.id || '',
    name: { en: getLocalizedValue(agent.name, language) || '' },
    description: { en: getLocalizedValue(agent.description, language) || '' },
    userPrompt: agent.userPrompt || '',
    trigger: agent.trigger || { type: 'endpoint', config: null },
    llmConfig: agent.llmConfig || { model: '', temperature: 0, maxTokens: 0, provider: 'emporix_openai', additionalParams: null },
    mcpServers: agent.mcpServers || [],
    nativeTools: agent.nativeTools || [],
<<<<<<< Updated upstream
=======
    agentCollaborations: agent.agentCollaborations || [],
>>>>>>> Stashed changes
    maxRecursionLimit: agent.maxRecursionLimit || 20,
    enableMemory: agent.enableMemory !== undefined ? agent.enableMemory : true,
    enabled: agent.enabled || false,
    metadata: agent.metadata || {
      version: 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      schema: null,
      mixins: {}
    }
  };
};

export const createEmptyAgent = (): CustomAgent => ({
  id: '',
  name: { en: '' },
  description: { en: '' },
  userPrompt: '',
  trigger: { type: 'endpoint', config: null },
  llmConfig: { model: '', temperature: 0, maxTokens: 0, provider: 'emporix_openai', additionalParams: null },
  mcpServers: [],
  nativeTools: [],
<<<<<<< Updated upstream
=======
  agentCollaborations: [],
>>>>>>> Stashed changes
  maxRecursionLimit: 20,
  enableMemory: true,
  enabled: true,
  metadata: { version: 1, createdAt: '', modifiedAt: '', schema: null, mixins: {} },
  icon: '',
  tags: [],
});

export const iconMap: Record<string, any> = {
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
  mobile: faMobile
}; 