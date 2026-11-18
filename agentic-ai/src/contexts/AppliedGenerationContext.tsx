import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  pendingAfterScopeChange,
  type ProvenanceEnvelope,
} from '../utils/aiProvenance'

interface PendingAppliedGeneration {
  envelope: ProvenanceEnvelope
  toolProvenanceKey?: string
}

interface AppliedGenerationContextValue {
  recordAppliedGeneration: (
    envelope: ProvenanceEnvelope | null,
    toolProvenanceKey?: string
  ) => void
  readAppliedGenerations: () => readonly ProvenanceEnvelope[]
  readAppliedToolProvenanceKeys: () => readonly (string | undefined)[]
  clearAppliedGenerations: () => void
}

const noopValue: AppliedGenerationContextValue = {
  recordAppliedGeneration: () => undefined,
  readAppliedGenerations: () => [],
  readAppliedToolProvenanceKeys: () => [],
  clearAppliedGenerations: () => undefined,
}

const AppliedGenerationContext =
  createContext<AppliedGenerationContextValue | null>(null)

export const AppliedGenerationProvider = ({
  children,
  scopeId,
}: {
  readonly children: ReactNode
  readonly scopeId?: string
}) => {
  const pendingRef = useRef<PendingAppliedGeneration[]>([])
  const scopeRef = useRef(scopeId)
  if (scopeRef.current !== scopeId) {
    pendingRef.current = pendingAfterScopeChange(
      pendingRef.current,
      scopeRef.current,
      scopeId
    )
    scopeRef.current = scopeId
  }

  const recordAppliedGeneration = useCallback(
    (envelope: ProvenanceEnvelope | null, toolProvenanceKey?: string) => {
      if (envelope) {
        pendingRef.current.push(
          toolProvenanceKey ? { envelope, toolProvenanceKey } : { envelope }
        )
      }
    },
    []
  )

  const readAppliedGenerations = useCallback(
    () => pendingRef.current.map((item) => item.envelope),
    []
  )

  const readAppliedToolProvenanceKeys = useCallback(
    () => pendingRef.current.map((item) => item.toolProvenanceKey),
    []
  )

  const clearAppliedGenerations = useCallback(() => {
    pendingRef.current = []
  }, [])

  const value = useMemo(
    () => ({
      recordAppliedGeneration,
      readAppliedGenerations,
      readAppliedToolProvenanceKeys,
      clearAppliedGenerations,
    }),
    [
      recordAppliedGeneration,
      readAppliedGenerations,
      readAppliedToolProvenanceKeys,
      clearAppliedGenerations,
    ]
  )

  return (
    <AppliedGenerationContext.Provider value={value}>
      {children}
    </AppliedGenerationContext.Provider>
  )
}

export const useAppliedGeneration = (): AppliedGenerationContextValue =>
  useContext(AppliedGenerationContext) ?? noopValue
