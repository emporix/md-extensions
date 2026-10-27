import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Props } from '../helpers/props'
import { useParams, useSearchParams } from 'react-router'
import Localized from '../models/Localized.model'

export interface ActiveNodeState {
  name?: Localized
  code?: string
  published?: boolean
  sellable?: boolean
  dynamicVariantType?: string
}

interface ActiveNodeContextValue {
  activeNodeState: ActiveNodeState
  setActiveNodeState: React.Dispatch<React.SetStateAction<ActiveNodeState>>
  overriddenFields: Set<string>
  markOverridden: (field: string) => void
  removeOverridden: (field: string) => void
  clearOverridden: () => void
  inheritedValues: Record<string, unknown>
  setInheritedValues: (values: Record<string, unknown>) => void
  isAddFlow: boolean
}

const ActiveNodeContext = createContext<ActiveNodeContextValue>({
  activeNodeState: {},
  setActiveNodeState: () => {
    //NOOP
  },
  overriddenFields: new Set(),
  markOverridden: () => {
    //NOOP
  },
  removeOverridden: () => {
    //NOOP
  },
  clearOverridden: () => {
    //NOOP
  },
  inheritedValues: {},
  setInheritedValues: () => {
    //NOOP
  },
  isAddFlow: false,
})

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveNode = () => useContext(ActiveNodeContext)

export const ActiveNodeProvider: FC<Props> = ({ children }) => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const parentVariantIdParam = searchParams.get('parentVariantId')

  const [activeNodeState, setActiveNodeState] = useState<ActiveNodeState>({})
  const [overriddenFields, setOverriddenFields] = useState<Set<string>>(
    new Set()
  )
  const [inheritedValues, setInheritedValuesRaw] = useState<
    Record<string, unknown>
  >({})

  const isAddFlow = !id && !!parentVariantIdParam

  useEffect(() => {
    setActiveNodeState({})
    setOverriddenFields(new Set())
    setInheritedValuesRaw({})
  }, [id, parentVariantIdParam])

  const markOverridden = useCallback((field: string) => {
    setOverriddenFields((prev) => {
      if (prev.has(field)) return prev
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }, [])

  const removeOverridden = useCallback((field: string) => {
    setOverriddenFields((prev) => {
      if (!prev.has(field)) return prev
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }, [])

  const clearOverridden = useCallback(() => {
    setOverriddenFields(new Set())
  }, [])

  const setInheritedValues = useCallback((values: Record<string, unknown>) => {
    setInheritedValuesRaw(values)
  }, [])

  const value = useMemo(
    () => ({
      activeNodeState,
      setActiveNodeState,
      overriddenFields,
      markOverridden,
      removeOverridden,
      clearOverridden,
      inheritedValues,
      setInheritedValues,
      isAddFlow,
    }),
    [
      activeNodeState,
      setActiveNodeState,
      overriddenFields,
      markOverridden,
      removeOverridden,
      clearOverridden,
      inheritedValues,
      setInheritedValues,
      isAddFlow,
    ]
  )

  return (
    <ActiveNodeContext.Provider value={value}>
      {children}
    </ActiveNodeContext.Provider>
  )
}
