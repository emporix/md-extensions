import { createContext, useContext, useState, useMemo } from 'react'
import type {
  DashboardContextValue,
  DashboardSite,
  DashboardTimeRange,
  DashboardAppState,
} from '../models/DashboardContext.types'
import {
  getRangeForPreset,
  toISODateString,
} from '../helpers/timeRange.helpers'

const getDefaultTimeRange = (): DashboardTimeRange => {
  const { from, to } = getRangeForPreset('last30')
  return {
    preset: 'last30',
    from: toISODateString(from),
    to: toISODateString(to),
  }
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

type DashboardProviderProps = {
  children: React.ReactNode
  appState?: DashboardAppState | null
  initialSite?: DashboardSite | null
  initialTimeRange?: DashboardTimeRange
}

export const DashboardProvider = ({
  children,
  appState = null,
  initialSite = null,
  initialTimeRange = getDefaultTimeRange(),
}: DashboardProviderProps) => {
  const [site, setSiteState] = useState<DashboardSite | null>(initialSite)
  const [timeRange, setTimeRangeState] =
    useState<DashboardTimeRange>(initialTimeRange)

  const value = useMemo<DashboardContextValue>(
    () => ({
      appState,
      site,
      timeRange,
      setSite: setSiteState,
      setTimeRange: setTimeRangeState,
    }),
    [appState, site, timeRange]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboardContext = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext)
  if (ctx === null) {
    throw new Error('useDashboardContext must be used within DashboardProvider')
  }
  return ctx
}
