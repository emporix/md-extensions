import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  ConfirmBox,
  Dropdown,
  FieldLabel,
  InputText,
  PrimaryButton,
  SecondaryButton,
} from '@emporix/component-library'
import { AiGeneratedNotice } from '../shared/AiGeneratedNotice'
import { RichMarkdown } from './RichMarkdown'
import { useAppState } from '../../contexts/AppStateContext'
import { useToast } from '../../contexts/ToastContext'
import { useAgentChat } from '../../hooks/useAgentChat'
import { useAgents } from '../../hooks/useAgents'
import { useChatRecommendations } from '../../hooks/useChatRecommendations'
import {
  isEnabledAgentPresent,
  useHelperAgentProvisioning,
} from '../../hooks/useHelperAgentProvisioning'
import {
  patchCustomAgent,
  RECOMMENDED_PROMPTS_AGENT_ID,
  RECOMMENDED_PROMPTS_TEMPLATE_NOT_FOUND_KEY,
  createRecommendedPromptsAgent,
} from '../../services/agentService'
import { commerceTriggerExtractEvents } from '../../utils/agentFilterDslHelpers'
import {
  buildChatInvokePatchOperations,
  getChatInvokeGates,
  CHAT_AGENT_QUERY_PARAM,
  nextAgentIdFromQuery,
  shouldShowAssistantActivity,
  shouldShowRecommendationEmpty,
  type ChatInvokeGate,
} from '../../utils/agentChatHelpers'
import { formatApiError } from '../../utils/errorHelpers'
import { formatChatResponseText } from '../../utils/formatHelpers'
import { getLocalizedValue } from '../../utils/agentHelpers'

type AgentOption = {
  readonly label: string
  readonly value: string
}

type PendingChatSend = {
  readonly text: string
  readonly source: 'composer' | 'recommendation'
}

type InvokeGateState = {
  readonly pending: PendingChatSend
  readonly pendingGates: readonly ChatInvokeGate[]
  readonly acceptedGates: readonly ChatInvokeGate[]
}

const RECOMMENDED_PROMPTS_HELPER_I18N_KEYS = {
  agentCreated: 'chat_recommended_agent_created',
  agentExists: 'chat_recommended_agent_exists',
  createFailed: 'chat_recommended_create_failed',
  enableFailed: 'chat_recommended_enable_failed',
} as const

type ChatBubbleProps = {
  readonly role: 'user' | 'assistant' | 'error'
  readonly className?: string
  readonly as?: 'article' | 'p'
  readonly children: ReactNode
}

const ChatBubble = ({
  role,
  className,
  as: Tag = 'article',
  children,
}: ChatBubbleProps) => (
  <div className={`agent-chat-row agent-chat-row-${role}`}>
    <Tag
      className={
        className
          ? `agent-chat-bubble agent-chat-bubble-${role} ${className}`
          : `agent-chat-bubble agent-chat-bubble-${role}`
      }
    >
      {children}
    </Tag>
  </div>
)

const AgentChatPage = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const { showError } = useToast()
  const { customAgents, customAgentsLoading, refreshCustomAgents } = useAgents({
    loadTemplates: false,
  })
  const { messages, status, activity, send, reset, stop } = useAgentChat()
  const [agentId, setAgentId] = useState<string | null>(null)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)
  const [invokeGateState, setInvokeGateState] =
    useState<InvokeGateState | null>(null)
  const [invokePatching, setInvokePatching] = useState(false)
  const [draft, setDraft] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedAgentId = searchParams.get(CHAT_AGENT_QUERY_PARAM)

  const enabledAgents = useMemo(
    () =>
      customAgents.filter(
        (agent) => agent.enabled && agent.id !== RECOMMENDED_PROMPTS_AGENT_ID
      ),
    [customAgents]
  )
  const agentOptions = useMemo<AgentOption[]>(
    () =>
      enabledAgents.map((agent) => ({
        value: agent.id,
        label:
          getLocalizedValue(agent.name, appState.contentLanguage) || agent.id,
      })),
    [appState.contentLanguage, enabledAgents]
  )

  const hasUserMessage = messages.some((message) => message.role === 'user')

  useEffect(() => {
    const nextId = nextAgentIdFromQuery(
      agentId,
      requestedAgentId,
      enabledAgents.map((agent) => agent.id),
      hasUserMessage
    )
    if (nextId !== agentId) {
      setAgentId(nextId)
    }
  }, [agentId, enabledAgents, hasUserMessage, requestedAgentId])

  useEffect(() => {
    if (!agentId || requestedAgentId === agentId) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set(CHAT_AGENT_QUERY_PARAM, agentId)
    setSearchParams(nextParams, { replace: true })
  }, [agentId, requestedAgentId, searchParams, setSearchParams])

  useEffect(() => {
    const transcript = transcriptRef.current
    if (!transcript) {
      return
    }
    transcript.scrollTop = transcript.scrollHeight
  }, [messages, activity?.text])

  const streaming = status === 'streaming'
  const selectedAgent =
    enabledAgents.find((agent) => agent.id === agentId) ?? null
  const recommendationTarget = useMemo(() => {
    if (!selectedAgent) {
      return null
    }
    const commerceTrigger = selectedAgent.triggers?.find(
      (trigger) => trigger.type.trim().toLowerCase() === 'commerce_events'
    )
    return {
      id: selectedAgent.id,
      name: getLocalizedValue(selectedAgent.name, appState.contentLanguage),
      description: getLocalizedValue(
        selectedAgent.description,
        appState.contentLanguage
      ),
      prompt: selectedAgent.userPrompt ?? '',
      templatePrompt: selectedAgent.templatePrompt,
      commerceEventTypes: commerceTriggerExtractEvents(
        commerceTrigger?.config ?? null
      ),
    }
  }, [appState.contentLanguage, selectedAgent])

  const resolveRecommendationError = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (
        err instanceof Error &&
        err.message === RECOMMENDED_PROMPTS_TEMPLATE_NOT_FOUND_KEY
      ) {
        return t(err.message)
      }
      return formatApiError(err, t(fallbackKey))
    },
    [t]
  )

  const recommendationsAgentPresent = customAgentsLoading
    ? null
    : isEnabledAgentPresent(customAgents, RECOMMENDED_PROMPTS_AGENT_ID)

  const {
    provisioningAgent: provisioningRecommendations,
    handleEnableHelperAgent: enableRecommendations,
  } = useHelperAgentProvisioning({
    agentId: RECOMMENDED_PROMPTS_AGENT_ID,
    shouldCheck: false,
    createAgent: createRecommendedPromptsAgent,
    i18nKeys: RECOMMENDED_PROMPTS_HELPER_I18N_KEYS,
    resolveErrorMessage: resolveRecommendationError,
    onEnabled: () => {
      void refreshCustomAgents()
    },
  })

  const { recommendations, loading: recommendationsLoading } =
    useChatRecommendations(
      recommendationTarget,
      recommendationsAgentPresent === true
    )

  useEffect(() => {
    if (!agentId || streaming || invokePatching) {
      return
    }
    document.getElementById('agent-chat-prompt')?.focus({ preventScroll: true })
  }, [agentId, streaming, invokePatching])

  const handleAgentChange = (nextId: string) => {
    if (!nextId || nextId === agentId) {
      return
    }
    if (hasUserMessage) {
      setPendingAgentId(nextId)
      return
    }
    setInvokeGateState(null)
    setAgentId(nextId)
  }

  const confirmAgentChange = () => {
    if (!pendingAgentId) {
      return
    }
    reset()
    setInvokeGateState(null)
    setAgentId(pendingAgentId)
    setPendingAgentId(null)
  }

  const deliverSend = (text: string, source: PendingChatSend['source']) => {
    if (!agentId) {
      return
    }
    if (source === 'composer') {
      setDraft('')
    }
    void send(agentId, text).then((result) => {
      if (result === 'error') {
        if (source === 'composer') {
          setDraft(text)
          return
        }
        if (draft.trim().length === 0) {
          setDraft(text)
        }
      }
    })
  }

  const attemptSend = (text: string, source: PendingChatSend['source']) => {
    if (!agentId || streaming || invokePatching || text.length === 0) {
      return
    }
    const agent = enabledAgents.find((entry) => entry.id === agentId)
    if (!agent) {
      return
    }
    const gates = getChatInvokeGates(agent)
    if (gates.length === 0) {
      deliverSend(text, source)
      return
    }
    setInvokeGateState({
      pending: { text, source },
      pendingGates: gates,
      acceptedGates: [],
    })
  }

  const applyInvokeGatesAndSend = async (
    agent: (typeof enabledAgents)[number],
    acceptedGates: readonly ChatInvokeGate[],
    pending: PendingChatSend
  ) => {
    const patches = buildChatInvokePatchOperations(agent, acceptedGates)
    if (patches.length === 0) {
      deliverSend(pending.text, pending.source)
      return
    }
    setInvokePatching(true)
    try {
      await patchCustomAgent(appState, agent.id, patches)
      await refreshCustomAgents()
      setInvokeGateState(null)
      deliverSend(pending.text, pending.source)
    } catch (err) {
      console.error(err)
      showError(formatApiError(err, t('chat_gate_patch_error')))
      setInvokeGateState(null)
      if (pending.source === 'recommendation') {
        setDraft((current) =>
          current.trim().length === 0 ? pending.text : current
        )
      }
    } finally {
      setInvokePatching(false)
    }
  }

  const handleInvokeGateAccept = () => {
    if (!invokeGateState || !selectedAgent) {
      return
    }
    const [currentGate, ...remainingGates] = invokeGateState.pendingGates
    if (!currentGate) {
      return
    }
    const acceptedGates = [...invokeGateState.acceptedGates, currentGate]
    if (remainingGates.length > 0) {
      setInvokeGateState({
        pending: invokeGateState.pending,
        pendingGates: remainingGates,
        acceptedGates,
      })
      return
    }
    void applyInvokeGatesAndSend(
      selectedAgent,
      acceptedGates,
      invokeGateState.pending
    )
  }

  const handleSend = () => {
    attemptSend(draft.trim(), 'composer')
  }

  const handleRecommendation = (prompt: string) => {
    const text = prompt.trim()
    if (text.length === 0) {
      return
    }
    attemptSend(text, 'recommendation')
  }

  const activeInvokeGate = invokeGateState?.pendingGates[0] ?? null
  const invokeGateDialog =
    activeInvokeGate === 'employee_scope'
      ? {
          title: t('chat_gate_scope_title'),
          message: t('chat_gate_scope_body'),
          acceptLabel: t('chat_gate_scope_confirm'),
        }
      : activeInvokeGate === 'api_trigger'
        ? {
            title: t('chat_gate_trigger_title'),
            message: t('chat_gate_trigger_body'),
            acceptLabel: t('chat_gate_trigger_confirm'),
          }
        : null

  const activityLabel =
    activity?.kind === 'tool'
      ? t('chat_using_tool', { name: activity.text })
      : activity?.text || t('chat_thinking')

  return (
    <section className="agent-chat-page">
      <header className="agent-chat-header">
        <h1 className="agent-chat-title page-title">{t('chat_title')}</h1>
        <SecondaryButton className="agent-chat-reset-btn" onClick={reset}>
          <i className="pi pi-refresh" aria-hidden="true" />
          {t('chat_reset')}
        </SecondaryButton>
      </header>
      <AiGeneratedNotice variant="short" />
      <div className="agent-chat-card">
        <div className="agent-chat-transcript" ref={transcriptRef}>
          {customAgentsLoading && messages.length === 0 ? (
            <p className="agent-chat-empty">{t('loading')}</p>
          ) : (
            <ChatBubble role="assistant">{t('chat_welcome')}</ChatBubble>
          )}
          {messages.map((message) => {
            const hasText = message.text.trim().length > 0
            const showStatus = shouldShowAssistantActivity(
              streaming,
              message.role === 'assistant' &&
                message.id === messages[messages.length - 1]?.id,
              hasText,
              activity !== null
            )
            return (
              <ChatBubble key={message.id} role={message.role}>
                {message.role === 'assistant' && hasText ? (
                  <RichMarkdown text={formatChatResponseText(message.text)} />
                ) : null}
                {message.role === 'assistant' ? null : message.text}
                {showStatus ? (
                  <p className="agent-chat-activity" aria-live="polite">
                    <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                    {activityLabel}
                  </p>
                ) : null}
              </ChatBubble>
            )
          })}
        </div>
        <label className="agent-chat-prompt-label" htmlFor="agent-chat-prompt">
          {t('chat_prompt_label')}
        </label>
        <InputText
          textarea
          inputId="agent-chat-prompt"
          className="agent-chat-input"
          rows={4}
          value={draft}
          placeholder={t('chat_placeholder')}
          disabled={!agentId || streaming || invokePatching}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
        />
        <div className="agent-chat-toolbar">
          <div className="agent-chat-picker">
            <FieldLabel
              className="agent-chat-picker-label"
              htmlFor="agent-chat-agent"
            >
              {hasUserMessage ? t('chat_chatting_to') : t('chat_choose_agent')}
            </FieldLabel>
            <Dropdown
              inputId="agent-chat-agent"
              className="agent-chat-agent"
              value={agentId}
              options={agentOptions}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) => {
                if (typeof event.value === 'string') {
                  handleAgentChange(event.value)
                }
              }}
              disabled={agentOptions.length === 0}
            />
          </div>
          {streaming ? (
            <PrimaryButton className="agent-chat-send-btn" onClick={stop}>
              <i className="pi pi-stop" aria-hidden="true" />
              {t('chat_stop')}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              className="agent-chat-send-btn"
              onClick={handleSend}
              disabled={!agentId || draft.trim().length === 0 || invokePatching}
            >
              <i className="pi pi-send" aria-hidden="true" />
              {t('chat_send')}
            </PrimaryButton>
          )}
        </div>
        <div
          className="agent-chat-recommended"
          aria-busy={
            recommendationsAgentPresent === null || recommendationsLoading
          }
        >
          <p className="agent-chat-recommended-label">
            {t('chat_recommended')}
          </p>
          {recommendationsAgentPresent === null ? (
            <span className="agent-chat-activity">
              <i className="pi pi-spin pi-spinner" aria-hidden="true" />
              {t('chat_recommended_checking')}
            </span>
          ) : null}
          {recommendationsAgentPresent === false ? (
            <>
              <p className="agent-chat-recommended-empty">
                {t('chat_recommended_intro')}
              </p>
              <SecondaryButton
                className="agent-chat-recommended-enable"
                disabled={provisioningRecommendations}
                onClick={() => {
                  void enableRecommendations()
                }}
              >
                <i className="pi pi-plus" aria-hidden="true" />
                {t('chat_recommended_enable')}
              </SecondaryButton>
            </>
          ) : null}
          {recommendationsAgentPresent === true && recommendationsLoading ? (
            <span className="agent-chat-activity">
              <i className="pi pi-spin pi-spinner" aria-hidden="true" />
              {t('loading')}
            </span>
          ) : null}
          {recommendationsAgentPresent === true
            ? recommendations.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  className="agent-chat-recommended-chip"
                  disabled={streaming || invokePatching}
                  onClick={() => handleRecommendation(item.prompt)}
                >
                  {item.icon ? (
                    <span aria-hidden="true">{item.icon}</span>
                  ) : null}
                  {item.label}
                </button>
              ))
            : null}
          {shouldShowRecommendationEmpty(
            recommendationsAgentPresent === true,
            Boolean(agentId),
            recommendationsLoading,
            recommendations.length
          ) ? (
            <p className="agent-chat-recommended-empty">
              {t('chat_recommended_empty')}
            </p>
          ) : null}
        </div>
      </div>
      <ConfirmBox
        className="agent-chat-confirm"
        visible={pendingAgentId !== null}
        onReject={() => setPendingAgentId(null)}
        onAccept={confirmAgentChange}
        title={t('chat_switch_title')}
        message={t('chat_switch_body')}
        acceptLabel={t('chat_switch_confirm')}
        rejectLabel={t('cancel')}
      />
      {invokeGateDialog ? (
        <ConfirmBox
          className="agent-chat-confirm"
          visible={pendingAgentId === null && invokeGateState !== null}
          onReject={() => setInvokeGateState(null)}
          onAccept={handleInvokeGateAccept}
          title={invokeGateDialog.title}
          message={invokeGateDialog.message}
          acceptLabel={invokeGateDialog.acceptLabel}
          rejectLabel={t('cancel')}
        />
      ) : null}
    </section>
  )
}

export default AgentChatPage
