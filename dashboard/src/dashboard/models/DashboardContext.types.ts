/**
 * Dashboard context and widget layout types.
 */

export type TimeRangePreset = 'last7' | 'last30' | 'mtd' | 'ytd' | 'custom'

export type DashboardTimeRange = {
  preset: TimeRangePreset
  /** ISO date string (YYYY-MM-DD) */
  from: string
  /** ISO date string (YYYY-MM-DD) */
  to: string
}

export type DashboardSite = {
  code: string
  name: string
  currency: string
  /** True when this is the default site from the API */
  default?: boolean
}

export type DashboardAppState = {
  tenant: string
  language: string
  token: string
  /** ISO currency code from host app state (e.g. USD, EUR) */
  currency?: string
  /** Permissions from host (e.g. systemPreferences.manager for saving global layout) */
  permissions?: { systemPreferences?: { manager?: boolean } }
}

export type DashboardContextValue = {
  appState: DashboardAppState | null
  site: DashboardSite | null
  timeRange: DashboardTimeRange
  setSite: (site: DashboardSite | null) => void
  setTimeRange: (timeRange: DashboardTimeRange) => void
}

export type WidgetSize = {
  colSpan?: number
  rowSpan?: number
}

export type WidgetLayout = {
  id: string
  colSpan?: number
  rowSpan?: number
}

/** Layout item for react-grid-layout (drag/resize grid). */
export type GridLayoutItem = {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export type WidgetDefinition = {
  id: string
  label: string
  defaultColSpan?: number
  defaultRowSpan?: number
}
