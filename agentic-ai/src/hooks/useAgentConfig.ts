import { useState, useEffect, useCallback } from 'react'
import {
  CustomAgent,
  LlmConfig,
  McpServer,
  NativeTool,
  LocalizedString,
  LlmProvider,
} from '../types/Agent'
import { upsertCustomAgent } from '../services/agentService'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import { ApiClientError } from '../services/apiClient'
import { formatApiError } from '../utils/errorHelpers'
import { hasAnyLocalizedValue } from '../utils/agentHelpers'
import {
  AgentCommerceFilterDsl,
  commerceTriggerExtractEvents,
  commerceTriggerExtractFilter,
  mergeCommerceTriggerPersistedConfig,
  isCommerceFilterValid,
} from '../utils/agentFilterDslHelpers'
import {
  getValidCollaborations,
  areCollaborationsValid,
} from '../utils/agentCollaborationHelpers'
import { isValidAgentOutputJsonSchema } from '../utils/validateJsonSchema'
import {
  areTeamsAgentToolsValid,
  getSelectedTeamsToolIds,
  isAgentDefaultInboundOwnerForTeamsTools,
  teamsNativeToolHasAllowedOperations,
  TEAMS_TRIGGER,
} from '../utils/teamsRoutingHelpers'
import {
  areSlackAgentToolsValid,
  getSelectedSlackToolIds,
  slackNativeToolHasAllowedOperations,
} from '../utils/slackRoutingHelpers'
import { COLLABORATION_TRIGGER_TYPES } from '../utils/constants'
import { Tool } from '../types/Tool'

interface UseAgentConfigProps {
  agent: CustomAgent | null
  availableTools: Tool[]
  onSave: (agent: CustomAgent) => void
  onHide: () => void
}

interface AgentCollaboration {
  agentId: string
  description: string
}

interface AgentConfigState {
  agentId: string
  agentName: LocalizedString
  description: LocalizedString
  agentType: string
  triggerTypes: string[]
  prompt: string
  templatePrompt: string
  outputFormat: string
  model: string
  temperature: string
  disableTemperature: boolean
  maxTokens: string
  provider: LlmProvider
  tokenId: string
  recursionLimit: string
  enableMemory: boolean
  selectedIcon: string
  mcpServers: McpServer[]
  nativeTools: NativeTool[]
  agentCollaborations: AgentCollaboration[]
  tags: string[]
  requiredScopes: string[]
  selfHostedUrl: string
  selfHostedUseOAuth: boolean
  selfHostedAuthHeaderName: string
  selfHostedTokenId: string
  oauthId: string
  commerceEvents: string[]
  commerceEventFilter: AgentCommerceFilterDsl | null
}

export const useAgentConfig = ({
  agent,
  availableTools,
  onSave,
  onHide,
}: UseAgentConfigProps) => {
  const appState = useAppState()
  const { showSuccess, showError } = useToast()
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disableConfirmMessage, setDisableConfirmMessage] = useState('')
  const [pendingAgent, setPendingAgent] = useState<CustomAgent | null>(null)

  const [state, setState] = useState<AgentConfigState>({
    agentId: '',
    agentName: {} as LocalizedString,
    description: {} as LocalizedString,
    agentType: 'custom',
    triggerTypes: ['endpoint'],
    prompt: '',
    templatePrompt: '',
    outputFormat: '',
    model: '',
    temperature: '0',
    disableTemperature: false,
    maxTokens: '0',
    provider: LlmProvider.EMPORIX_OPENAI,
    tokenId: '',
    recursionLimit: '20',
    enableMemory: true,
    selectedIcon: 'robot',
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    tags: [],
    requiredScopes: [],
    selfHostedUrl: '',
    selfHostedUseOAuth: false,
    selfHostedAuthHeaderName: '',
    selfHostedTokenId: '',
    oauthId: '',
    commerceEvents: [],
    commerceEventFilter: null,
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (agent) {
      const agentType = agent.type || 'custom'
      const loadedTriggerTypes = agent.triggers?.map(
        (trigger) => trigger.type
      ) || ['endpoint']
      const collaborationTriggers =
        COLLABORATION_TRIGGER_TYPES as readonly string[]
      const supportTriggerTypes = loadedTriggerTypes
        .filter((type) => collaborationTriggers.includes(type))
        .filter((type) => type !== TEAMS_TRIGGER)
      const triggerTypes =
        agentType === 'support'
          ? supportTriggerTypes.length > 0
            ? supportTriggerTypes
            : ['slack']
          : loadedTriggerTypes.filter(
              (type) =>
                !collaborationTriggers.includes(type) && type !== TEAMS_TRIGGER
            )

      setState({
        agentId: agent.id,
        agentName: agent.name || ({} as LocalizedString),
        description: agent.description || ({} as LocalizedString),
        agentType: agentType,
        triggerTypes,
        prompt: agent.userPrompt || '',
        templatePrompt: agent.templatePrompt || '',
        outputFormat: agent.outputFormat || '',
        model: agent.llmConfig?.model || '',
        temperature: agent.llmConfig?.temperature?.toString() || '0',
        disableTemperature: agent.llmConfig?.temperature === undefined,
        maxTokens: agent.llmConfig?.maxTokens?.toString() || '0',
        provider: agent.llmConfig?.provider || LlmProvider.EMPORIX_OPENAI,
        tokenId: agent.llmConfig?.token?.id || '',
        recursionLimit: agent.maxRecursionLimit?.toString() || '20',
        enableMemory:
          agent.enableMemory !== undefined ? !!agent.enableMemory : true,
        selectedIcon: agent.icon || 'robot',
        mcpServers: agent.mcpServers || [],
        nativeTools: agent.nativeTools || [],
        agentCollaborations: agent.agentCollaborations || [],
        tags: agent.tags || [],
        requiredScopes: agent.requiredScopes || [],
        selfHostedUrl: agent.llmConfig?.selfHostedParams?.url || '',
        ...(() => {
          const selfHostedParams = agent.llmConfig?.selfHostedParams
          const resolveRefId = (
            ref: { id: string } | string | undefined
          ) => (typeof ref === 'object' ? ref?.id || '' : ref || '')

          const oauthId = resolveRefId(selfHostedParams?.oauth)

          if (oauthId) {
            return {
              selfHostedUseOAuth: true,
              selfHostedAuthHeaderName: '',
              selfHostedTokenId: '',
              oauthId,
            }
          }

          return {
            selfHostedUseOAuth: false,
            selfHostedAuthHeaderName:
              selfHostedParams?.authorizationHeaderName || '',
            selfHostedTokenId: resolveRefId(
              selfHostedParams?.authorizationHeaderToken
            ),
            oauthId: '',
          }
        })(),
        ...(() => {
          const raw = agent.triggers?.find(
            (trigger) => trigger.type === 'commerce_events'
          )?.config as Record<string, unknown> | null | undefined
          return {
            commerceEvents: commerceTriggerExtractEvents(raw ?? null),
            commerceEventFilter: commerceTriggerExtractFilter(raw ?? null),
          }
        })(),
      })
    }
  }, [agent])

  const updateField = useCallback((field: string, value: unknown) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const buildAgentFromState = useCallback(() => {
    if (!agent) return null

    const triggerTypesForSave = state.triggerTypes.filter(
      (type) => type !== TEAMS_TRIGGER
    )

    const triggers = triggerTypesForSave.map((triggerType) => ({
      type: triggerType,
      config:
        triggerType === 'commerce_events'
          ? mergeCommerceTriggerPersistedConfig(
              state.commerceEvents,
              state.commerceEventFilter
            )
          : null,
    }))

    const existingTeamsTrigger = agent.triggers?.find(
      (trigger) => trigger.type === TEAMS_TRIGGER
    )
    const isDefaultInboundAgent = isAgentDefaultInboundOwnerForTeamsTools(
      state.agentId,
      state.nativeTools,
      availableTools
    )
    if (existingTeamsTrigger && isDefaultInboundAgent) {
      triggers.push(existingTeamsTrigger)
    }

    return {
      ...agent,
      id: state.agentId || '',
      name: state.agentName || ({} as LocalizedString),
      description: state.description || ({} as LocalizedString),
      triggers: triggers,
      userPrompt: state.prompt || '',
      templatePrompt: state.templatePrompt || undefined,
      outputFormat: state.outputFormat.trim() || undefined,
      llmConfig: (() => {
        const baseConfig: LlmConfig = {
          model: state.model || '',
          maxTokens: parseInt(state.maxTokens, 10) || 0,
          provider: state.provider,
          additionalParams: agent.llmConfig?.additionalParams || null,
        }

        if (!state.disableTemperature) {
          baseConfig.temperature = parseFloat(state.temperature) || 0
        }

        if (
          state.provider !== LlmProvider.EMPORIX_OPENAI &&
          state.provider !== LlmProvider.SELF_HOSTED_OLLAMA &&
          state.provider !== LlmProvider.SELF_HOSTED_VLLM &&
          state.tokenId
        ) {
          baseConfig.token = { id: state.tokenId }
        }

        if (
          state.provider === LlmProvider.SELF_HOSTED_OLLAMA ||
          state.provider === LlmProvider.SELF_HOSTED_VLLM
        ) {
          baseConfig.selfHostedParams = {
            url: state.selfHostedUrl || '',
          }

          if (state.selfHostedUseOAuth) {
            if (state.oauthId) {
              baseConfig.selfHostedParams.oauth = { id: state.oauthId }
            }
          } else {
            if (state.selfHostedAuthHeaderName) {
              baseConfig.selfHostedParams.authorizationHeaderName =
                state.selfHostedAuthHeaderName
            }

            if (state.selfHostedTokenId) {
              baseConfig.selfHostedParams.authorizationHeaderToken = {
                id: state.selfHostedTokenId,
              }
            }
          }
        }

        return baseConfig
      })(),
      maxRecursionLimit: parseInt(state.recursionLimit, 10) || 20,
      enableMemory: state.enableMemory,
      mcpServers: state.mcpServers || [],
      nativeTools: state.nativeTools || [],
      agentCollaborations: getValidCollaborations(state.agentCollaborations),
      enabled: agent.enabled || false,
      type: agent.type,
      metadata: agent.metadata || {
        version: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        schema: null,
        mixins: {},
      },
      icon: state.selectedIcon,
      tags: state.tags || [],
      requiredScopes: state.requiredScopes || [],
    } as CustomAgent
  }, [agent, state, availableTools])

  const handleSave = useCallback(async () => {
    if (!agent) return

    setSaving(true)

    const updatedAgent = buildAgentFromState()
    if (!updatedAgent) {
      setSaving(false)
      return
    }

    try {
      const savedAgent = await upsertCustomAgent(appState, updatedAgent)

      setSaving(false)
      const isUpdate = !!agent.id
      showSuccess(
        isUpdate ? 'Agent updated successfully!' : 'Agent created successfully!'
      )
      onSave(savedAgent)
      onHide()

      setPendingAgent(null)
      setShowDisableConfirm(false)
    } catch (error) {
      setSaving(false)

      if (error instanceof ApiClientError && error.disableable) {
        setPendingAgent(updatedAgent)
        setDisableConfirmMessage(error.message)
        setShowDisableConfirm(true)
        return
      }

      if (error instanceof ApiClientError && error.status === 409) {
        showError(
          'Agent with this ID already exists. Please choose a different ID.'
        )
        return
      }

      const errorMessage = formatApiError(error, 'Failed to save agent')
      showError(`Error saving agent: ${errorMessage}`)
    }
  }, [
    agent,
    appState,
    buildAgentFromState,
    onSave,
    onHide,
    showSuccess,
    showError,
  ])

  const handleConfirmDisable = useCallback(async () => {
    if (!pendingAgent) return

    setSaving(true)
    setShowDisableConfirm(false)

    try {
      const disabledAgent: CustomAgent = {
        ...pendingAgent,
        enabled: false,
      }

      const savedAgent = await upsertCustomAgent(appState, disabledAgent)

      setSaving(false)
      const isUpdate = !!pendingAgent.id
      const successMessage = isUpdate
        ? 'Agent updated and deactivated successfully!'
        : 'Agent created and deactivated successfully!'
      showSuccess(successMessage)
      onSave(savedAgent)
      onHide()

      setPendingAgent(null)
    } catch (error) {
      setSaving(false)
      const errorMessage = formatApiError(error, 'Failed to save agent')
      showError(`Error saving agent: ${errorMessage}`)
      setPendingAgent(null)
    }
  }, [pendingAgent, appState, onSave, onHide, showSuccess, showError])

  const handleCancelDisable = useCallback(() => {
    setShowDisableConfirm(false)
    setPendingAgent(null)
    setSaving(false)
  }, [])

  const isFormValid = useCallback(() => {
    const isCreating = !agent?.id
    const isEmporixProvider = state.provider === LlmProvider.EMPORIX_OPENAI
    const isSelfHosted =
      state.provider === LlmProvider.SELF_HOSTED_OLLAMA ||
      state.provider === LlmProvider.SELF_HOSTED_VLLM

    const basicValidation =
      hasAnyLocalizedValue(state.agentName) &&
      hasAnyLocalizedValue(state.description) &&
      state.prompt.trim() &&
      state.model.trim() &&
      (isCreating ? state.agentId.trim() : true)

    const tokenValidation =
      isEmporixProvider || isSelfHosted || !isCreating || state.tokenId.trim()

    const selfHostedValidation =
      !isSelfHosted ||
      (state.selfHostedUrl.trim() &&
        (!state.selfHostedUseOAuth || !!state.oauthId.trim()))

    const commerceFilterValidation =
      !state.triggerTypes.includes('commerce_events') ||
      (state.commerceEvents.length > 0 &&
        (!state.commerceEventFilter ||
          isCommerceFilterValid(state.commerceEventFilter)))

    const collaborationValidation = areCollaborationsValid(
      state.agentCollaborations
    )

    const outputFormatValidation = isValidAgentOutputJsonSchema(
      state.outputFormat
    )

    const supportTriggerValidation =
      state.agentType !== 'support' || state.triggerTypes.includes('slack')

    const teamsToolValidation =
      areTeamsAgentToolsValid(state.nativeTools, availableTools) &&
      getSelectedTeamsToolIds(state.nativeTools, availableTools).every(
        (toolId) => {
          const nativeTool = state.nativeTools.find(
            (tool) => tool.id === toolId
          )
          const tool = availableTools.find((entry) => entry.id === toolId)
          return teamsNativeToolHasAllowedOperations(nativeTool, tool)
        }
      )

    const slackToolValidation =
      areSlackAgentToolsValid(state.nativeTools, availableTools) &&
      getSelectedSlackToolIds(state.nativeTools, availableTools).every(
        (toolId) => {
          const nativeTool = state.nativeTools.find(
            (tool) => tool.id === toolId
          )
          const tool = availableTools.find((entry) => entry.id === toolId)
          return slackNativeToolHasAllowedOperations(nativeTool, tool)
        }
      )

    return (
      basicValidation &&
      tokenValidation &&
      selfHostedValidation &&
      commerceFilterValidation &&
      collaborationValidation &&
      outputFormatValidation &&
      supportTriggerValidation &&
      teamsToolValidation &&
      slackToolValidation
    )
  }, [state, agent?.id, availableTools])

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid(),
    showDisableConfirm,
    disableConfirmMessage,
    handleConfirmDisable,
    handleCancelDisable,
  }
}
