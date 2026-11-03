import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../contexts/AppStateContext'
import { useToast } from '../contexts/ToastContext'
import {
  chatWithAgent,
  chatWithAgentOnce,
  uploadChatImage,
} from '../services/agentService'
import {
  ChatImageUploadError,
  uploadChatImagesInOrder,
} from '../utils/chatImageUpload'
import {
  nextSessionId,
  nextThinkingText,
  nextToolActivityText,
} from '../utils/agentChatHelpers'
import { appendChatArtifact, type ChatArtifact } from '../utils/chatArtifacts'
import {
  formatApiError,
  isAbortError,
  isChatBadRequest,
} from '../utils/errorHelpers'

export type AgentChatRole = 'user' | 'assistant' | 'error'

export type AgentChatImage = {
  readonly id: string
  readonly name: string
  readonly previewUrl?: string
  readonly kind: 'image' | 'file'
}

export type PendingChatImage = AgentChatImage & {
  readonly file: File
  readonly attachmentId?: string
}

export type AgentChatMessage = {
  readonly id: string
  readonly role: AgentChatRole
  readonly text: string
  readonly artifacts?: readonly ChatArtifact[]
  readonly images?: readonly AgentChatImage[]
}

export type AgentChatActivity =
  | { readonly kind: 'thinking'; readonly text: string }
  | { readonly kind: 'tool'; readonly text: string }

const EMPTY_RESPONSE_KEY = 'chat_error'

export type AgentChatSendResult = 'ok' | 'error' | 'aborted' | 'ignored'

export const useAgentChat = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const { showError } = useToast()
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'uploading' | 'streaming'>(
    'idle'
  )
  const [activity, setActivity] = useState<AgentChatActivity | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamingRef = useRef(false)
  const idRef = useRef(0)

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    streamingRef.current = false
    setMessages([])
    setActivity(null)
    setStatus('idle')
    setSessionId((stored) => nextSessionId(true, stored))
  }, [])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    []
  )

  const send = useCallback(
    async (
      agentId: string,
      message: string,
      images: readonly PendingChatImage[] = [],
      onCommitted?: () => void,
      onPartialUpload?: (attachmentIds: readonly string[]) => void
    ) => {
      const trimmed = message.trim()
      if (!trimmed || streamingRef.current) {
        return 'ignored'
      }

      const controller = new AbortController()
      abortRef.current = controller
      streamingRef.current = true
      const storedSession = nextSessionId(false, sessionId)
      let activeSession = storedSession ?? undefined
      let attachments:
        | Awaited<ReturnType<typeof uploadChatImagesInOrder>>['attachments']
        | undefined
      if (images.length > 0) {
        setStatus('uploading')
        try {
          const uploaded = await uploadChatImagesInOrder(
            images,
            (file, imageSessionId) =>
              uploadChatImage(appState, agentId, file, {
                sessionId: imageSessionId,
                signal: controller.signal,
              }),
            activeSession
          )
          attachments = uploaded.attachments
          activeSession = uploaded.sessionId
          if (uploaded.sessionId) {
            setSessionId(uploaded.sessionId)
          }
        } catch (err) {
          if (err instanceof ChatImageUploadError) {
            if (err.sessionId) {
              setSessionId(err.sessionId)
            }
            if (err.uploaded.length > 0) {
              onPartialUpload?.(err.uploaded.map((item) => item.attachmentId))
            }
          }
          if (abortRef.current === controller) {
            abortRef.current = null
            streamingRef.current = false
            setStatus('idle')
          }
          if (isAbortError(err)) {
            return 'aborted'
          }
          showError(formatApiError(err, t('chat_image_upload_failed')))
          return 'error'
        }
      }

      idRef.current += 1
      const userId = `chat-${idRef.current}`
      idRef.current += 1
      const assistantId = `chat-${idRef.current}`

      setMessages((current) => [
        ...current,
        {
          id: userId,
          role: 'user',
          text: trimmed,
          ...(images.length > 0
            ? {
                images: images.map((image) => ({
                  id: image.id,
                  name: image.name,
                  ...(image.previewUrl ? { previewUrl: image.previewUrl } : {}),
                  kind: image.kind,
                })),
              }
            : {}),
        },
        { id: assistantId, role: 'assistant', text: '' },
      ])
      onCommitted?.()
      setStatus('streaming')
      setActivity(null)

      const replaceAssistant = (
        next: Pick<AgentChatMessage, 'role' | 'text'>
      ) => {
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId ? { ...entry, ...next } : entry
          )
        )
      }

      let result: AgentChatSendResult = 'ok'
      try {
        let reply: string
        try {
          reply = await chatWithAgent(appState, agentId, trimmed, {
            emptyResponseKey: EMPTY_RESPONSE_KEY,
            sessionId: activeSession,
            attachments,
            signal: controller.signal,
            onToken: (accumulated) => {
              replaceAssistant({ role: 'assistant', text: accumulated })
              setActivity(null)
            },
            onThinking: (content) => {
              setActivity((current) => {
                const base = current?.kind === 'thinking' ? current.text : null
                const next = nextThinkingText(base, content)
                if (next === null) {
                  return current?.kind === 'thinking' ? null : current
                }
                return { kind: 'thinking', text: next }
              })
            },
            onToolActivity: (toolName) => {
              const text = nextToolActivityText(toolName)
              setActivity(text ? { kind: 'tool', text } : null)
            },
            onArtifact: (artifact) => {
              setMessages((current) =>
                current.map((entry) =>
                  entry.id === assistantId
                    ? {
                        ...entry,
                        artifacts: appendChatArtifact(
                          entry.artifacts,
                          artifact
                        ),
                      }
                    : entry
                )
              )
            },
            onSessionId: setSessionId,
          })
        } catch (streamErr) {
          if (isAbortError(streamErr) || !isChatBadRequest(streamErr)) {
            throw streamErr
          }
          reply = await chatWithAgentOnce(appState, agentId, trimmed, {
            emptyResponseKey: EMPTY_RESPONSE_KEY,
            sessionId: activeSession,
            attachments,
            signal: controller.signal,
            onSessionId: setSessionId,
          })
        }
        replaceAssistant({ role: 'assistant', text: reply })
      } catch (err) {
        if (isAbortError(err)) {
          result = 'aborted'
        } else {
          const errorText =
            err instanceof Error && err.message === EMPTY_RESPONSE_KEY
              ? t(EMPTY_RESPONSE_KEY)
              : formatApiError(err, t(EMPTY_RESPONSE_KEY))
          showError(errorText)
          replaceAssistant({ role: 'error', text: errorText })
          result = 'error'
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          streamingRef.current = false
          setStatus('idle')
          setActivity(null)
        }
      }
      return result
    },
    [appState, sessionId, showError, t]
  )

  return { messages, status, activity, sessionId, send, reset, stop }
}
