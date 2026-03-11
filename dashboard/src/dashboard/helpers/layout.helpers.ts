import type { Layout } from 'react-grid-layout/legacy'
import type { GridLayoutItem } from '../models/DashboardContext.types'
import { getDefaultLayout } from '../data/widgetRegistry'

const parseStoredItem = (item: unknown): GridLayoutItem | null => {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  const i = o.i
  const x = o.x
  const y = o.y
  const w = o.w
  const h = o.h
  if (
    typeof i !== 'string' ||
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof w !== 'number' ||
    typeof h !== 'number'
  ) {
    return null
  }
  const out: GridLayoutItem = { i, x, y, w, h }
  if (typeof o.minW === 'number') out.minW = o.minW
  if (typeof o.minH === 'number') out.minH = o.minH
  if (typeof o.maxW === 'number') out.maxW = o.maxW
  if (typeof o.maxH === 'number') out.maxH = o.maxH
  return out
}

const LEGACY_COLS = 3
const LEGACY_ROW_SCALE = 3
const COLS = 24

const isLegacy3ColLayout = (layout: GridLayoutItem[]): boolean =>
  layout.length > 0 &&
  layout.every((item) => item.w <= LEGACY_COLS && item.x < LEGACY_COLS)

const migrateFrom3Col = (layout: GridLayoutItem[]): GridLayoutItem[] => {
  const scaleW = COLS / LEGACY_COLS
  return layout.map((item) => ({
    ...item,
    x: Math.round(item.x * scaleW),
    y: item.y,
    w: Math.max(1, Math.round(item.w * scaleW)),
    h: Math.max(1, item.h * LEGACY_ROW_SCALE),
  }))
}

/** Configuration key used in the Configuration Service for dashboard layout. */
export const DASHBOARD_LAYOUT_CONFIG_KEY = 'dashboard_layout'

/** LocalStorage key for dashboard layout (client-side fallback). */
export const LOCAL_STORAGE_LAYOUT_KEY = 'md_dashboard_layout'

/**
 * Reads and parses dashboard layout from localStorage.
 * Returns null if key is missing, empty, or value is invalid.
 */
export const getLayoutFromLocalStorage = (): GridLayoutItem[] | null => {
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_LAYOUT_KEY)
        : null
    if (raw == null || raw === '') return null
    const parsed: unknown = JSON.parse(raw)
    const layout = parseLayoutValue(parsed, [])
    return layout.length > 0 ? layout : null
  } catch {
    return null
  }
}

/**
 * Saves dashboard layout to localStorage (custom configuration).
 */
export const saveLayoutToLocalStorage = (layout: GridLayoutItem[]): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_LAYOUT_KEY, JSON.stringify(layout))
}

/**
 * Removes dashboard layout from localStorage (used when resetting to defaults).
 */
export const clearLayoutFromLocalStorage = (): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_LAYOUT_KEY)
}

/**
 * Parses a raw value (e.g. from Configuration Service) into a layout array.
 * Returns fallback if value is not a valid layout.
 */
export const parseLayoutValue = (
  value: unknown,
  fallback: GridLayoutItem[]
): GridLayoutItem[] => {
  try {
    if (!Array.isArray(value)) return fallback
    const result: GridLayoutItem[] = []
    for (const item of value) {
      const next = parseStoredItem(item)
      if (next) result.push(next)
    }
    if (result.length === 0) return fallback
    return isLegacy3ColLayout(result) ? migrateFrom3Col(result) : result
  } catch {
    return fallback
  }
}

const getMaxY = (layout: GridLayoutItem[]): number => {
  if (layout.length === 0) return 0
  return Math.max(...layout.map((item) => item.y + item.h))
}

export const addWidget = (
  layout: GridLayoutItem[],
  widgetId: string
): GridLayoutItem[] => {
  if (layout.some((item) => item.i === widgetId)) return layout
  const { colSpan, rowSpan } = getDefaultLayout(widgetId)
  const w = Math.max(1, colSpan)
  const h = Math.max(1, rowSpan)
  const maxY = getMaxY(layout)
  return [...layout, { i: widgetId, x: 0, y: maxY, w, h, minW: 1, minH: 1 }]
}

export const removeWidget = (
  layout: GridLayoutItem[],
  widgetId: string
): GridLayoutItem[] => layout.filter((item) => item.i !== widgetId)

const RESIZE_HANDLES: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'> =
  ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']

export { RESIZE_HANDLES }

export const toRglLayout = (items: GridLayoutItem[]): Layout =>
  items.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW ?? 1,
    minH: item.minH ?? 1,
    maxW: item.maxW,
    maxH: item.maxH,
    resizeHandles: [...RESIZE_HANDLES],
  }))

export const fromRglLayout = (layout: Layout): GridLayoutItem[] =>
  layout.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW,
    minH: item.minH,
    maxW: item.maxW,
    maxH: item.maxH,
  }))

export const isKpiWidget = (widgetId: string): boolean =>
  widgetId.toLowerCase().endsWith('kpi')
