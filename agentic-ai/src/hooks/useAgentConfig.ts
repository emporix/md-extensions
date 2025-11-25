import { useState, useEffect, useCallback } from 'react'
import { CustomAgent, LlmConfig, McpServer, NativeTool } from '../types/Agent'
import { AgentService } from '../services/agentService'
import { AppState } from '../types/common'
import { getLocalizedValue } from '../utils/agentHelpers'
import { useToast } from '../contexts/ToastContext'
import { ApiClientError } from '../services/apiClient'
import { formatApiError } from '../utils/errorHelpers'

interface UseAgentConfigProps {
  agent: CustomAgent | null
  appState: AppState
  onSave: (agent: CustomAgent) => void
  onHide: () => void
}

interface AgentCollaboration {
  agentId: string
  description: string
}

interface AgentConfigState {
  agentId: string
  agentName: string
  description: string
  agentType: string
  triggerTypes: string[]
  prompt: string
  templatePrompt: string
  model: string
  temperature: string
  maxTokens: string
  provider: string
  tokenId: string
  recursionLimit: string
  enableMemory: boolean
  selectedIcon: string
  mcpServers: McpServer[]
  nativeTools: NativeTool[]
  agentCollaborations: AgentCollaboration[]
  tags: string[]
  requiredScopes: string[]
  // Self-hosted LLM parameters
  selfHostedUrl: string
  selfHostedAuthHeaderName: string
  selfHostedTokenId: string
  // Commerce events
  commerceEvents: string[]
}

export const useAgentConfig = ({
  agent,
  appState,
  onSave,
  onHide,
}: UseAgentConfigProps) => {
  const { showSuccess, showError } = useToast()
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disableConfirmMessage, setDisableConfirmMessage] = useState('')
  const [pendingAgent, setPendingAgent] = useState<CustomAgent | null>(null)

  const [state, setState] = useState<AgentConfigState>({
    agentId: '',
    agentName: '',
    description: '',
    agentType: 'custom',
    triggerTypes: ['endpoint'],
    prompt: '',
    templatePrompt: '',
    model: '',
    temperature: '0',
    maxTokens: '0',
    provider: 'emporix_openai',
    tokenId: '',
    recursionLimit: '20',
    enableMemory: true,
    selectedIcon: 'robot',
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    tags: [],
    requiredScopes: [],
    // Self-hosted LLM parameters
    selfHostedUrl: '',
    selfHostedAuthHeaderName: '',
    selfHostedTokenId: '',
    // Commerce events
    commerceEvents: [],
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (agent) {
      const agentType = agent.type || 'custom'
      const triggerTypes = agent.triggers?.map((trigger) => trigger.type) || [
        'endpoint',
      ]

      setState({
        agentId: agent.id,
        agentName: getLocalizedValue(agent.name, 'en'),
        description: getLocalizedValue(agent.description, 'en'),
        agentType: agentType,
        triggerTypes: agentType === 'support' ? ['slack'] : triggerTypes,
        prompt: agent.userPrompt || '',
        templatePrompt: agent.templatePrompt || '',
        model: agent.llmConfig?.model || '',
        temperature: agent.llmConfig?.temperature?.toString() || '0',
        maxTokens: agent.llmConfig?.maxTokens?.toString() || '0',
        provider: agent.llmConfig?.provider || 'emporix_openai',
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
        // Self-hosted LLM parameters
        selfHostedUrl: agent.llmConfig?.selfHostedParams?.url || '',
        selfHostedAuthHeaderName:
          agent.llmConfig?.selfHostedParams?.authorizationHeaderName || '',
        selfHostedTokenId:
          (typeof agent.llmConfig?.selfHostedParams
            ?.authorizationHeaderToken === 'object'
            ? agent.llmConfig.selfHostedParams.authorizationHeaderToken.id
            : agent.llmConfig?.selfHostedParams?.authorizationHeaderToken) ||
          '',
        // Commerce events
        commerceEvents:
          (agent.triggers?.find((trigger) => trigger.type === 'commerce_events')
            ?.config?.events as string[]) || [],
      })
    }
  }, [agent])

  const updateField = useCallback((field: string, value: unknown) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const buildAgentFromState = useCallback(() => {
    if (!agent) return null

    // Create triggers array from selected trigger types
    const triggers = state.triggerTypes.map((triggerType) => ({
      type: triggerType,
      config:
        triggerType === 'commerce_events'
          ? { events: state.commerceEvents }
          : null,
    }))

    return {
      ...agent,
      id: state.agentId || '',
      name: { en: state.agentName || '' },
      description: { en: state.description || '' },
      triggers: triggers,
      userPrompt: state.prompt || '',
      templatePrompt: state.templatePrompt || undefined,
      llmConfig: (() => {
        const baseConfig: LlmConfig = {
          model: state.model || '',
          temperature: parseFloat(state.temperature) || 0,
          maxTokens: parseInt(state.maxTokens, 10) || 0,
          provider: state.provider,
          additionalParams: agent.llmConfig?.additionalParams || null,
        }

        // Add regular token for non-emporix and non-self-hosted providers
        if (
          state.provider !== 'emporix_openai' &&
          state.provider !== 'self_hosted_ollama' &&
          state.tokenId
        ) {
          baseConfig.token = { id: state.tokenId }
        }

        // Add selfHostedParams for self-hosted providers
        if (state.provider === 'self_hosted_ollama') {
          baseConfig.selfHostedParams = {
            url: state.selfHostedUrl || '',
          }

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

        return baseConfig
      })(),
      maxRecursionLimit: parseInt(state.recursionLimit, 10) || 20,
      enableMemory: state.enableMemory,
      mcpServers: state.mcpServers || [],
      nativeTools: state.nativeTools || [],
      agentCollaborations: state.agentCollaborations || [],
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
  }, [agent, state])

  const handleSave = useCallback(async () => {
    if (!agent) return

    setSaving(true)

    const updatedAgent = buildAgentFromState()
    if (!updatedAgent) {
      setSaving(false)
      return
    }

    try {
      const agentService = new AgentService(appState)
      const savedAgent = await agentService.upsertCustomAgent(updatedAgent)

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

      const agentService = new AgentService(appState)
      const savedAgent = await agentService.upsertCustomAgent(disabledAgent)

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
    const isEmporixProvider = state.provider === 'emporix_openai'
    const isSelfHosted = state.provider === 'self_hosted_ollama'

    const basicValidation =
      state.agentName.trim() &&
      state.description.trim() &&
      state.prompt.trim() &&
      state.model.trim() &&
      (isCreating ? state.agentId.trim() : true)

    // Token validation:
    // - Never required for emporix_openai or self_hosted_ollama
    // - Only required when creating (not updating) for other providers
    const tokenValidation =
      isEmporixProvider || isSelfHosted || !isCreating || state.tokenId.trim()

    // Self-hosted validation:
    // - URL is always required for self-hosted
    const selfHostedValidation = !isSelfHosted || state.selfHostedUrl.trim()

    // Commerce events validation:
    // - Events are required when trigger type is commerce_events
    const commerceEventsValidation =
      !state.triggerTypes.includes('commerce_events') ||
      (state.commerceEvents && state.commerceEvents.length > 0)

    return (
      basicValidation &&
      tokenValidation &&
      selfHostedValidation &&
      commerceEventsValidation
    )
  }, [state, agent?.id])

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
