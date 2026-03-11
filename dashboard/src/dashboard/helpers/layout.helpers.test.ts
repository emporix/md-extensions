import { afterEach, describe, expect, it } from 'vitest'
import type { GridLayoutItem } from '../models/DashboardContext.types'
import {
  addWidget,
  removeWidget,
  parseLayoutValue,
  isKpiWidget,
  toRglLayout,
  fromRglLayout,
  getLayoutFromLocalStorage,
  saveLayoutToLocalStorage,
  clearLayoutFromLocalStorage,
  LOCAL_STORAGE_LAYOUT_KEY,
} from './layout.helpers'

const makeItem = (overrides: Partial<GridLayoutItem> = {}): GridLayoutItem => ({
  i: 'widget1',
  x: 0,
  y: 0,
  w: 8,
  h: 4,
  ...overrides,
})

describe('addWidget', () => {
  it('adds a new widget at the bottom', () => {
    const layout = [makeItem({ i: 'a', y: 0, h: 3 })]
    const result = addWidget(layout, 'b')
    expect(result).toHaveLength(2)
    expect(result[1].i).toBe('b')
    expect(result[1].y).toBe(3)
  })

  it('does not add duplicate widget', () => {
    const layout = [makeItem({ i: 'a' })]
    const result = addWidget(layout, 'a')
    expect(result).toHaveLength(1)
  })

  it('does not mutate original layout', () => {
    const layout = [makeItem({ i: 'a' })]
    const copy = [...layout]
    addWidget(layout, 'b')
    expect(layout).toEqual(copy)
  })
})

describe('removeWidget', () => {
  it('removes widget by id', () => {
    const layout = [makeItem({ i: 'a' }), makeItem({ i: 'b' })]
    const result = removeWidget(layout, 'a')
    expect(result).toHaveLength(1)
    expect(result[0].i).toBe('b')
  })

  it('returns same array if widget not found', () => {
    const layout = [makeItem({ i: 'a' })]
    const result = removeWidget(layout, 'nonexistent')
    expect(result).toHaveLength(1)
  })
})

describe('parseLayoutValue', () => {
  const fallback = [makeItem({ i: 'default' })]

  it('returns fallback for non-array', () => {
    expect(parseLayoutValue('bad', fallback)).toBe(fallback)
    expect(parseLayoutValue(null, fallback)).toBe(fallback)
    expect(parseLayoutValue(42, fallback)).toBe(fallback)
  })

  it('returns fallback for empty array', () => {
    expect(parseLayoutValue([], fallback)).toBe(fallback)
  })

  it('parses valid layout items', () => {
    const raw = [{ i: 'w1', x: 0, y: 0, w: 8, h: 4 }]
    const result = parseLayoutValue(raw, fallback)
    expect(result).toHaveLength(1)
    expect(result[0].i).toBe('w1')
  })

  it('filters out invalid items', () => {
    const raw = [{ i: 'w1', x: 0, y: 0, w: 8, h: 4 }, { bad: true }]
    const result = parseLayoutValue(raw, fallback)
    expect(result).toHaveLength(1)
  })
})

describe('isKpiWidget', () => {
  it('returns true for ids ending in kpi (case insensitive)', () => {
    expect(isKpiWidget('grossRevenueKpi')).toBe(true)
    expect(isKpiWidget('totalOrderCountKpi')).toBe(true)
  })

  it('returns false for non-kpi ids', () => {
    expect(isKpiWidget('revenueOverTime')).toBe(false)
    expect(isKpiWidget('lastOrdersTable')).toBe(false)
  })
})

describe('getLayoutFromLocalStorage', () => {
  const originalLocalStorage = global.localStorage

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })

  it('returns null when key is missing', () => {
    const storage: Record<string, string> = {}
    const getItem = (key: string) => storage[key] ?? null
    Object.defineProperty(global, 'localStorage', {
      value: { getItem },
      writable: true,
    })
    expect(getLayoutFromLocalStorage()).toBeNull()
  })

  it('returns null when value is empty string', () => {
    const getItem = () => ''
    Object.defineProperty(global, 'localStorage', {
      value: { getItem },
      writable: true,
    })
    expect(getLayoutFromLocalStorage()).toBeNull()
  })

  it('returns null when value is invalid JSON', () => {
    const getItem = () => 'not json'
    Object.defineProperty(global, 'localStorage', {
      value: { getItem },
      writable: true,
    })
    expect(getLayoutFromLocalStorage()).toBeNull()
  })

  it('returns null when value parses to empty layout', () => {
    const getItem = () => '[]'
    Object.defineProperty(global, 'localStorage', {
      value: { getItem },
      writable: true,
    })
    expect(getLayoutFromLocalStorage()).toBeNull()
  })

  it('returns parsed layout when valid items are stored', () => {
    const layout = [{ i: 'w1', x: 0, y: 0, w: 8, h: 4 }]
    const getItem = (key: string) =>
      key === LOCAL_STORAGE_LAYOUT_KEY ? JSON.stringify(layout) : null
    Object.defineProperty(global, 'localStorage', {
      value: { getItem },
      writable: true,
    })
    const result = getLayoutFromLocalStorage()
    expect(result).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result![0].i).toBe('w1')
    expect(result![0].w).toBe(8)
  })
})

describe('saveLayoutToLocalStorage', () => {
  const originalLocalStorage = global.localStorage

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })

  it('writes layout to localStorage and getLayoutFromLocalStorage reads it back', () => {
    const storage: Record<string, string> = {}
    const getItem = (key: string) => storage[key] ?? null
    const setItem = (key: string, value: string) => {
      storage[key] = value
    }
    Object.defineProperty(global, 'localStorage', {
      value: { getItem, setItem },
      writable: true,
    })
    const layout = [makeItem({ i: 'w1', w: 8, h: 4 })]
    saveLayoutToLocalStorage(layout)
    const raw = storage[LOCAL_STORAGE_LAYOUT_KEY]
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].i).toBe('w1')
    expect(parsed[0].w).toBe(8)
  })
})

describe('clearLayoutFromLocalStorage', () => {
  const originalLocalStorage = global.localStorage

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })

  it('removes layout key so getLayoutFromLocalStorage returns null', () => {
    const storage: Record<string, string> = {
      [LOCAL_STORAGE_LAYOUT_KEY]: JSON.stringify([makeItem({ i: 'w1' })]),
    }
    const getItem = (key: string) => storage[key] ?? null
    const setItem = (key: string, value: string) => {
      storage[key] = value
    }
    const removeItem = (key: string) => {
      delete storage[key]
    }
    Object.defineProperty(global, 'localStorage', {
      value: { getItem, setItem, removeItem },
      writable: true,
    })
    expect(getLayoutFromLocalStorage()).not.toBeNull()
    clearLayoutFromLocalStorage()
    expect(storage[LOCAL_STORAGE_LAYOUT_KEY]).toBeUndefined()
    expect(getLayoutFromLocalStorage()).toBeNull()
  })
})

describe('toRglLayout / fromRglLayout', () => {
  it('round-trips layout items', () => {
    const items: GridLayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 8, h: 4, minW: 2, minH: 2 },
    ]
    const rgl = toRglLayout(items)
    const back = fromRglLayout(rgl)
    expect(back[0].i).toBe('a')
    expect(back[0].x).toBe(0)
    expect(back[0].w).toBe(8)
  })

  it('sets default minW/minH of 1 when not specified', () => {
    const items: GridLayoutItem[] = [{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]
    const rgl = toRglLayout(items)
    expect(rgl[0].minW).toBe(1)
    expect(rgl[0].minH).toBe(1)
  })
})
