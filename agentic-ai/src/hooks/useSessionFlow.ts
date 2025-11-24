import { useCallback, useMemo, useState } from 'react'
import { LogMessage, SessionLogs } from '../types/Log'
import { AppState } from '../types/common'
import { LogService } from '../services/logService'

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

export const useSessionFlow = (appState: AppState) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flows, setFlows] = useState<SessionFlowGroup[]>([])

  const logService = useMemo(() => new LogService(appState), [appState])

  const fetchBySessionId = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true)
        setError(null)

        // Fetch session with messages from the new endpoint
        const session: SessionLogs = await logService.getSessionById(sessionId)

        // Map messages to nodes, filter for business logs only, and sort by timestamp
        const nodes: SessionFlowNode[] = (session.messages || [])
          .filter((m: LogMessage) => m.isBusinessLog)
          .map((m: LogMessage) => ({
            id: m.requestId || '',
            sessionId: session.sessionId,
            agentId: m.agentId,
            timestamp: m.timestamp,
            severity: m.severity,
            message: m.message,
          }))
          .sort(
            (a: SessionFlowNode, b: SessionFlowNode) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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
