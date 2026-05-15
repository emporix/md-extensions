import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'
import { Mixins } from '../models/Mixins'

export type MixinBulkPatch = { key: string; url: string; data: Mixins }

export type CustomerBulkMixinRegistryEntry = {
  validate: () => Promise<boolean>
  collect: () => Promise<MixinBulkPatch | null>
  discard: () => void
}

export type CustomerBulkMixinRegistry = {
  register: (
    id: string,
    entry: CustomerBulkMixinRegistryEntry
  ) => void
  unregister: (id: string) => void
  prepareMixinPatches: () => Promise<
    { ok: true; patches: MixinBulkPatch[] } | { ok: false }
  >
  discardMixinDrafts: () => void
}

const CustomerBulkMixinRegistryContext =
  createContext<CustomerBulkMixinRegistry | null>(null)

export function useCustomerBulkMixinRegistry(): CustomerBulkMixinRegistry | null {
  return useContext(CustomerBulkMixinRegistryContext)
}

export function useCreateCustomerBulkMixinRegistry(): CustomerBulkMixinRegistry {
  const mapRef = useRef(new Map<string, CustomerBulkMixinRegistryEntry>())

  const register = useCallback(
    (id: string, entry: CustomerBulkMixinRegistryEntry) => {
      mapRef.current.set(id, entry)
    },
    []
  )

  const unregister = useCallback((id: string) => {
    mapRef.current.delete(id)
  }, [])

  const prepareMixinPatches = useCallback(async () => {
    for (const [, entry] of mapRef.current) {
      if (!(await entry.validate())) {
        return { ok: false as const }
      }
    }
    const patches: MixinBulkPatch[] = []
    for (const [, entry] of mapRef.current) {
      const patch = await entry.collect()
      if (patch) patches.push(patch)
    }
    return { ok: true as const, patches }
  }, [])

  const discardMixinDrafts = useCallback(() => {
    for (const [, entry] of mapRef.current) {
      entry.discard()
    }
  }, [])

  return useMemo(
    () => ({
      register,
      unregister,
      prepareMixinPatches,
      discardMixinDrafts,
    }),
    [discardMixinDrafts, prepareMixinPatches, register, unregister]
  )
}

export function CustomerBulkMixinRegistryProvider({
  value,
  children,
}: {
  value: CustomerBulkMixinRegistry
  children: React.ReactNode
}) {
  return (
    <CustomerBulkMixinRegistryContext.Provider value={value}>
      {children}
    </CustomerBulkMixinRegistryContext.Provider>
  )
}
