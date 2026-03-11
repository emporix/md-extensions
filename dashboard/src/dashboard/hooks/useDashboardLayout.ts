import { useState, useEffect, useCallback, useRef } from 'react'
import type { GridLayoutItem } from '../models/DashboardContext.types'
import {
  parseLayoutValue,
  DASHBOARD_LAYOUT_CONFIG_KEY,
  getLayoutFromLocalStorage,
  saveLayoutToLocalStorage,
} from '../helpers/layout.helpers'
import type { TenantConfiguration } from '../api/configuration.api'
import {
  fetchBasicConfiguration,
  createConfigurations,
  updateConfiguration,
} from '../api/configuration.api'

export type UseDashboardLayoutResult = {
  layout: GridLayoutItem[]
  setLayout: (
    next: GridLayoutItem[] | ((prev: GridLayoutItem[]) => GridLayoutItem[])
  ) => void
  loading: boolean
  loadError: string | null
  saveError: string | null
  clearSaveError: () => void
  /** Saves current layout to configuration service (global). Requires tenant/token. */
  saveToGlobal: (layout: GridLayoutItem[]) => Promise<void>
  /** Saves current layout to localStorage (custom configuration). */
  saveToLocalStorage: (layout: GridLayoutItem[]) => void
  savingGlobal: boolean
}

const saveLayoutToApi = async (
  tenant: string,
  token: string,
  layout: GridLayoutItem[]
): Promise<TenantConfiguration | null> => {
  const key = DASHBOARD_LAYOUT_CONFIG_KEY

  try {
    const created = await createConfigurations({
      tenant,
      token,
      configurations: [{ key, value: layout }],
    })
    return created[0] ?? null
  } catch (error) {
    return updateConfiguration({
      tenant,
      token,
      propertyKey: key,
      configuration: {
        key,
        value: layout,
      },
    })   
  }
}

export const useDashboardLayout = (
  tenant: string | undefined,
  token: string | undefined,
  defaultLayout: GridLayoutItem[]
): UseDashboardLayoutResult => {
  const [layout, setLayoutState] = useState<GridLayoutItem[]>(defaultLayout)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const layoutConfigRef = useRef<TenantConfiguration | null>(null)
  const tenantRef = useRef<string | undefined>(tenant)
  const tokenRef = useRef<string | undefined>(token)

  const clearSaveError = useCallback(() => setSaveError(null), [])

  useEffect(() => {
    tenantRef.current = tenant
    tokenRef.current = token
  }, [tenant, token])

  useEffect(() => {
    let isActive = true

    const fromStorage = getLayoutFromLocalStorage()
    const hasLayoutFromStorage = fromStorage !== null

    if (hasLayoutFromStorage) {
      setLayoutState(fromStorage)
    }

    if (!tenant || !token) {
      layoutConfigRef.current = null
      if (!hasLayoutFromStorage) {
        setLayoutState(defaultLayout)
      }
      setLoading(false)
      setLoadError(null)
      return
    }

    setLoading(true)
    setLoadError(null)
    fetchBasicConfiguration({ tenant, token })
      .then((configs) => {
        if (!isActive) return
        const config = configs.find(
          (c) => c.key === DASHBOARD_LAYOUT_CONFIG_KEY
        )
        layoutConfigRef.current = config ?? null
        if (!hasLayoutFromStorage) {
          const layout = config
            ? parseLayoutValue(config.value, defaultLayout)
            : defaultLayout
          setLayoutState(layout)
        }
      })
      .catch((e) => {
        if (!isActive) return
        setLoadError(e instanceof Error ? e.message : 'Failed to load layout')
        if (!hasLayoutFromStorage) {
          setLayoutState(defaultLayout)
        }
      })
      .finally(() => {
        if (!isActive) return
        setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [tenant, token, defaultLayout])

  const saveToGlobal = useCallback(async (layoutToSave: GridLayoutItem[]) => {
    const currentTenant = tenantRef.current
    const currentToken = tokenRef.current
    if (!currentTenant || !currentToken) return
    setSaveError(null)
    setSavingGlobal(true)
    try {
      const updated = await saveLayoutToApi(
        currentTenant,
        currentToken,
        layoutToSave
      )
      if (updated) layoutConfigRef.current = updated
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save layout')
    } finally {
      setSavingGlobal(false)
    }
  }, [])

  const saveToLocalStorageCallback = useCallback(
    (layoutToSave: GridLayoutItem[]) => {
      saveLayoutToLocalStorage(layoutToSave)
    },
    []
  )

  const setLayout = useCallback(
    (
      next: GridLayoutItem[] | ((prev: GridLayoutItem[]) => GridLayoutItem[])
    ) => {
      setLayoutState((prev) => {
        const nextLayout = typeof next === 'function' ? next(prev) : next
        return nextLayout
      })
    },
    []
  )

  return {
    layout,
    setLayout,
    loading,
    loadError,
    saveError,
    clearSaveError,
    saveToGlobal,
    saveToLocalStorage: saveToLocalStorageCallback,
    savingGlobal,
  }
}
