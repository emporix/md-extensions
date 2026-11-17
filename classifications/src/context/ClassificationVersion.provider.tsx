import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

type ClassificationVersionProviderProps = {
  readonly children: ReactNode | ReactNode[]
}

interface ContextData {
  schemaVersions: Map<string, number>
  hasSchemaVersions: boolean
  getSchemaVersionForId: (schemaId: string) => number | undefined
  addSchemaVersion: (schemaId: string, version: number) => void
  removeSchemaVersion: (schemaId: string) => void
}

const Context = createContext<ContextData>({
  schemaVersions: new Map(),
  hasSchemaVersions: false,
  getSchemaVersionForId: () => 0,
  addSchemaVersion: () => {
    // NOOP
  },
  removeSchemaVersion: () => {
    // NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useClassificationVersionData = () => useContext(Context)

/**
 * Newer Emporix schema versions per schema tile (keyed by the tile id).
 * Ported from management-dashboard
 * `modules/classifications/contexts/ClassificationVersion.provider`.
 */
export const ClassificationVersionProvider = ({
  children,
}: ClassificationVersionProviderProps) => {
  const [schemaVersions, setSchemaVersions] = useState<Map<string, number>>(
    new Map()
  )

  const addSchemaVersion = useCallback((schemaId: string, version: number) => {
    setSchemaVersions((prev) =>
      prev.get(schemaId) === version
        ? prev
        : new Map(prev).set(schemaId, version)
    )
  }, [])

  const removeSchemaVersion = useCallback((schemaId: string) => {
    setSchemaVersions((prev) => {
      if (!prev.has(schemaId)) return prev
      const next = new Map(prev)
      next.delete(schemaId)
      return next
    })
  }, [])

  const getSchemaVersionForId = useCallback(
    (schemaId: string) => schemaVersions.get(schemaId),
    [schemaVersions]
  )

  return (
    <Context.Provider
      value={{
        schemaVersions,
        addSchemaVersion,
        removeSchemaVersion,
        getSchemaVersionForId,
        hasSchemaVersions: schemaVersions.size > 0,
      }}
    >
      {children}
    </Context.Provider>
  )
}
