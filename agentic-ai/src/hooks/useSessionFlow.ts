import { useCallback, useMemo, useState } from 'react'
import { LogMessage, SessionLogs } from '../types/Log'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import {
  findInitialMessageFromLog,
  findResponseFromLog,
  isSameLogMessage,
} from '../utils/logHelpers'

export interface SessionFlowNode {
  id: string
  sessionId: string
  agentId: string
  timestamp: string
  severity: LogMessage['severity']
  message: string
}

export interface SessionFlowGroup {
  sessionId: string
  agentId?: string
  nodes: SessionFlowNode[]
}

const toSessionFlowNode = (
  message: LogMessage,
  sessionId: string,
  displayMessage: string
): SessionFlowNode => ({
  id: message.requestId || '',
  sessionId,
  agentId: message.agentId,
  timestamp: message.timestamp,
  severity: message.severity,
  message: displayMessage,
})

export const buildSessionFlowNodes = (
  messages: LogMessage[],
  sessionId: string
): SessionFlowNode[] => {
  const initialMessage = findInitialMessageFromLog(messages)
  const responseMessage = findResponseFromLog(messages)

  return messages
    .filter(
      (message) =>
        message.isBusinessLog ||
        (initialMessage !== undefined &&
          isSameLogMessage(message, initialMessage.entry)) ||
        (responseMessage !== undefined &&
          isSameLogMessage(message, responseMessage.entry))
    )
    .map((message) => {
      if (responseMessage && isSameLogMessage(message, responseMessage.entry)) {
        return toSessionFlowNode(message, sessionId, responseMessage.text)
      }

      if (initialMessage && isSameLogMessage(message, initialMessage.entry)) {
        return toSessionFlowNode(message, sessionId, initialMessage.text)
      }

      return toSessionFlowNode(message, sessionId, message.message)
    })
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
}

export const useSessionFlow = () => {
  const appState = useAppState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flows, setFlows] = useState<SessionFlowGroup[]>([])

  const logService = useMemo(() => new LogService(appState), [appState])

  const fetchBySessionId = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true)
        setError(null)

        const session: SessionLogs = await logService.getSessionById(sessionId)
        const nodes = buildSessionFlowNodes(
          session.messages || [],
          session.sessionId
        )

        setFlows([{ sessionId, nodes }])
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Failed to fetch session flow'
        )
      } finally {
        setLoading(false)
      }
    },
    [logService]
  )

  return { flows, loading, error, fetchBySessionId }
}
