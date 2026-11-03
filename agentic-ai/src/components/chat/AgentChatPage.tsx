import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type PointerEvent,
  type WheelEvent,
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
import { AssistantMessageContent } from './AssistantMessageContent'
import ChatMessageArtifacts from './ChatMessageArtifacts'
import { RichResizeHandle } from './RichResizeHandle'
import { useAppState } from '../../contexts/AppStateContext'
import { useToast } from '../../contexts/ToastContext'
import { useAgentChat, type PendingChatImage } from '../../hooks/useAgentChat'
import { useAgents } from '../../hooks/useAgents'
import { useMyIamScopes } from '../../hooks/useMyIamScopes'
import { useChatRecommendations } from '../../hooks/useChatRecommendations'
import {
  isEnabledAgentPresent,
  useHelperAgentProvisioning,
} from '../../hooks/useHelperAgentProvisioning'
import {
  RECOMMENDED_PROMPTS_AGENT_ID,
  RECOMMENDED_PROMPTS_TEMPLATE_NOT_FOUND_KEY,
} from '../../constants/agentConstants'
import {
  patchCustomAgent,
  createRecommendedPromptsAgent,
} from '../../services/agentService'
import { commerceTriggerExtractEvents } from '../../utils/agentFilterDslHelpers'
import {
  buildChatInvokePatchOperations,
  canEditAgentInChat,
  canSeeAgentInChat,
  getChatInvokeGates,
  hasAgentManageScope,
  CHAT_AGENT_QUERY_PARAM,
  CHAT_TRANSCRIPT_MIN_HEIGHT,
  initialAgentIdFromQuery,
  isTranscriptNearBottom,
  nextChatCardHeight,
  nextAgentIdFromQuery,
  shouldShowAssistantActivity,
  shouldShowRecommendationEmpty,
  type ChatInvokeGate,
} from '../../utils/agentChatHelpers'
import { formatApiError } from '../../utils/errorHelpers'
import {
  newChatAttachmentKey,
  safeImageName,
  selectChatImages,
  withChatAttachmentType,
} from '../../utils/chatImageSelection'
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
  const { scopes, loading: scopesLoading } = useMyIamScopes()
  const canManageAgents = hasAgentManageScope(scopes.map((scope) => scope.id))
  const { messages, status, activity, send, reset, stop } = useAgentChat()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedAgentId = searchParams.get(CHAT_AGENT_QUERY_PARAM)
  const [agentId, setAgentId] = useState<string | null>(() =>
    initialAgentIdFromQuery(requestedAgentId)
  )
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)
  const [invokeGateState, setInvokeGateState] =
    useState<InvokeGateState | null>(null)
  const [invokePatching, setInvokePatching] = useState(false)
  const [draft, setDraft] = useState('')
  const [selectedImages, setSelectedImages] = useState<
    readonly PendingChatImage[]
  >([])
  const [fileDragActive, setFileDragActive] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const retainedPreviewUrls = useRef(new Set<string>())
  const selectedImagesRef = useRef(selectedImages)
  const followTranscriptRef = useRef(true)
  selectedImagesRef.current = selectedImages

  const enabledAgents = useMemo(
    () =>
      scopesLoading
        ? []
        : customAgents.filter(
            (agent) =>
              agent.enabled &&
              agent.id !== RECOMMENDED_PROMPTS_AGENT_ID &&
              canSeeAgentInChat(agent.tags, canManageAgents)
          ),
    [canManageAgents, customAgents, scopesLoading]
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

  const startCardResize = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const card = cardRef.current
    const transcript = transcriptRef.current
    const handle = event.currentTarget
    if (!card || !transcript) {
      return
    }
    const startHeight = card.getBoundingClientRect().height
    const originY = event.clientY
    const chrome = startHeight - transcript.getBoundingClientRect().height
    const minHeight = chrome + CHAT_TRANSCRIPT_MIN_HEIGHT
    const maxHeight = Math.max(
      minHeight,
      window.innerHeight - card.getBoundingClientRect().top - 16
    )
    handle.setPointerCapture(event.pointerId)
    const move = (ev: globalThis.PointerEvent) => {
      card.style.height = `${nextChatCardHeight(
        startHeight,
        ev.clientY - originY,
        minHeight,
        maxHeight
      )}px`
    }
    const stop = (ev: globalThis.PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) {
        handle.releasePointerCapture(ev.pointerId)
      }
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  const handleTranscriptWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (event.deltaY < 0) {
      followTranscriptRef.current = false
    }
  }

  const handleTranscriptScroll = () => {
    const transcript = transcriptRef.current
    if (!transcript) {
      return
    }
    followTranscriptRef.current = isTranscriptNearBottom(
      transcript.scrollTop,
      transcript.scrollHeight,
      transcript.clientHeight
    )
  }

  useEffect(() => {
    const transcript = transcriptRef.current
    if (!transcript || !followTranscriptRef.current) {
      return
    }
    transcript.scrollTop = transcript.scrollHeight
  }, [messages, activity?.text])

  const streaming = status === 'streaming'
  const busy = status !== 'idle'
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
    if (!agentId || busy || invokePatching) {
      return
    }
    document.getElementById('agent-chat-prompt')?.focus({ preventScroll: true })
  }, [agentId, busy, invokePatching])

  const revokePreview = (previewUrl: string | undefined) => {
    if (!previewUrl || retainedPreviewUrls.current.has(previewUrl)) {
      return
    }
    URL.revokeObjectURL(previewUrl)
  }

  const clearSelectedImages = () => {
    setSelectedImages((current) => {
      current.forEach((image) => revokePreview(image.previewUrl))
      return []
    })
  }

  const composerLocked = !agentId || busy || invokePatching

  const acceptPickedFiles = (picked: readonly File[]) => {
    const selection = selectChatImages(selectedImages.length, picked)
    if (selection.errorKey) {
      showError(t(selection.errorKey))
    }
    if (selection.accepted.length === 0) {
      return
    }
    setSelectedImages((current) => [
      ...current,
      ...selection.accepted.map((file) => {
        const typed = withChatAttachmentType(file)
        const kind = typed.type.startsWith('image/')
          ? ('image' as const)
          : ('file' as const)
        return {
          id: newChatAttachmentKey(),
          file: typed,
          name: safeImageName(typed.name),
          ...(kind === 'image'
            ? { previewUrl: URL.createObjectURL(typed) }
            : {}),
          kind,
        }
      }),
    ])
  }

  const isFileDrag = (event: DragEvent<HTMLDivElement>) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files')

  const dragStaysInside = (event: DragEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    return next instanceof Node && event.currentTarget.contains(next)
  }

  const handleCardDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event) || dragStaysInside(event)) {
      return
    }
    event.preventDefault()
    if (!composerLocked) {
      setFileDragActive(true)
    }
  }

  const handleCardDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) {
      return
    }
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = composerLocked ? 'none' : 'copy'
    }
  }

  const handleCardDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event) || dragStaysInside(event)) {
      return
    }
    setFileDragActive(false)
  }

  const handleCardDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) {
      return
    }
    event.preventDefault()
    setFileDragActive(false)
    if (composerLocked) {
      return
    }
    acceptPickedFiles(Array.from(event.dataTransfer?.files ?? []))
  }

  useEffect(
    () => () => {
      selectedImagesRef.current.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
      retainedPreviewUrls.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl)
      })
      retainedPreviewUrls.current.clear()
    },
    []
  )

  const handleReset = () => {
    clearSelectedImages()
    retainedPreviewUrls.current.forEach((previewUrl) => {
      URL.revokeObjectURL(previewUrl)
    })
    retainedPreviewUrls.current.clear()
    reset()
  }

  const handleAgentChange = (nextId: string) => {
    if (!nextId || nextId === agentId || busy) {
      return
    }
    if (hasUserMessage) {
      setPendingAgentId(nextId)
      return
    }
    setInvokeGateState(null)
    clearSelectedImages()
    setAgentId(nextId)
  }

  const confirmAgentChange = () => {
    if (!pendingAgentId) {
      return
    }
    handleReset()
    setInvokeGateState(null)
    setAgentId(pendingAgentId)
    setPendingAgentId(null)
  }

  const deliverSend = (text: string, source: PendingChatSend['source']) => {
    if (!agentId) {
      return
    }
    followTranscriptRef.current = true
    const outgoing = source === 'composer' ? selectedImages : []
    if (source === 'composer') {
      setDraft('')
    }
    void send(
      agentId,
      text,
      outgoing,
      () => {
        outgoing.forEach((image) => {
          if (image.previewUrl) {
            retainedPreviewUrls.current.add(image.previewUrl)
          }
        })
        setSelectedImages((current) =>
          current.filter(
            (image) => !outgoing.some((sent) => sent.id === image.id)
          )
        )
      },
      (attachmentIds) => {
        setSelectedImages((current) =>
          current.map((image) => {
            const index = outgoing.findIndex((item) => item.id === image.id)
            const attachmentId = index >= 0 ? attachmentIds[index] : undefined
            if (!attachmentId || image.attachmentId === attachmentId) {
              return image
            }
            return { ...image, attachmentId }
          })
        )
      }
    ).then((result) => {
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
    if (!agentId || busy || invokePatching || text.length === 0) {
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

  const handleEditAgent = () => {
    if (!agentId || !canEditAgentInChat(agentId, canManageAgents)) {
      return
    }
    window.location.href = `${window.location.pathname}#/agents/${encodeURIComponent(agentId)}/edit`
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
        <div className="agent-chat-header-actions">
          <SecondaryButton
            className="agent-chat-edit-btn"
            onClick={handleEditAgent}
            disabled={!canEditAgentInChat(agentId, canManageAgents)}
          >
            <i className="pi pi-pencil" aria-hidden="true" />
            {t('chat_edit_agent')}
          </SecondaryButton>
          <SecondaryButton
            className="agent-chat-reset-btn"
            onClick={handleReset}
          >
            <i className="pi pi-refresh" aria-hidden="true" />
            {t('chat_reset')}
          </SecondaryButton>
        </div>
      </header>
      <AiGeneratedNotice variant="short" />
      <div
        className="agent-chat-card"
        ref={cardRef}
        onDragEnter={handleCardDragEnter}
        onDragOver={handleCardDragOver}
        onDragLeave={handleCardDragLeave}
        onDrop={handleCardDrop}
      >
        <div
          className="agent-chat-transcript"
          ref={transcriptRef}
          onScroll={handleTranscriptScroll}
          onWheel={handleTranscriptWheel}
        >
          {(customAgentsLoading || scopesLoading) && messages.length === 0 ? (
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
                  <AssistantMessageContent text={message.text} />
                ) : null}
                {message.role === 'assistant' && message.artifacts?.length ? (
                  <ChatMessageArtifacts
                    appState={appState}
                    artifacts={message.artifacts}
                  />
                ) : null}
                {message.role === 'user' && message.images?.length ? (
                  <span className="agent-chat-sent-images">
                    {message.images.map((image) =>
                      image.kind === 'image' && image.previewUrl ? (
                        <img
                          key={image.id}
                          src={image.previewUrl}
                          alt={image.name}
                        />
                      ) : (
                        <span
                          key={image.id}
                          className="agent-chat-sent-file"
                          title={image.name}
                        >
                          <i className="pi pi-file" aria-hidden="true" />
                          <span>{image.name}</span>
                        </span>
                      )
                    )}
                  </span>
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
        <div
          className={
            fileDragActive
              ? 'agent-chat-composer agent-chat-composer-drop'
              : 'agent-chat-composer'
          }
        >
          <label
            className="agent-chat-prompt-label"
            htmlFor="agent-chat-prompt"
          >
            {t('chat_prompt_label')}
          </label>
          <InputText
            textarea
            inputId="agent-chat-prompt"
            className="agent-chat-input"
            rows={6}
            value={draft}
            placeholder={t('chat_placeholder')}
            disabled={composerLocked}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="agent-chat-attachments">
            <input
              ref={fileInputRef}
              className="agent-chat-file-input"
              type="file"
              accept="image/png,image/jpeg,application/pdf,text/csv,text/plain,.jpg,.jpeg,.png,.pdf,.csv,.txt,.text"
              multiple
              onChange={(event) => {
                acceptPickedFiles(Array.from(event.target.files ?? []))
                event.target.value = ''
              }}
            />
            <SecondaryButton
              className="agent-chat-attach-btn"
              aria-label={t('chat_attach_files')}
              disabled={composerLocked}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="pi pi-paperclip" aria-hidden="true" />
            </SecondaryButton>
            {selectedImages.map((image) => (
              <span
                key={image.id}
                className="agent-chat-attachment"
                title={image.name}
              >
                {image.kind === 'image' && image.previewUrl ? (
                  <img src={image.previewUrl} alt={image.name} />
                ) : (
                  <i className="pi pi-file" aria-hidden="true" />
                )}
                <span>{image.name}</span>
                <button
                  type="button"
                  aria-label={t('chat_remove_file')}
                  disabled={busy}
                  onClick={() => {
                    revokePreview(image.previewUrl)
                    setSelectedImages((current) =>
                      current.filter((entry) => entry.id !== image.id)
                    )
                  }}
                >
                  <i className="pi pi-times" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
          {fileDragActive ? (
            <p className="agent-chat-drop-hint">{t('chat_drop_files')}</p>
          ) : null}
        </div>
        {status === 'uploading' ? (
          <p className="agent-chat-activity" aria-live="polite">
            <i className="pi pi-spin pi-spinner" aria-hidden="true" />
            {t('chat_uploading_files')}
          </p>
        ) : null}
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
              disabled={agentOptions.length === 0 || busy}
            />
          </div>
          {busy ? (
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
                  disabled={busy || invokePatching}
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
        <RichResizeHandle
          label={t('chat_card_resize')}
          onPointerDown={startCardResize}
        />
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
