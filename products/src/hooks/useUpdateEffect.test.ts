import { describe, expect, it } from 'vitest'
import { depsChanged } from './useUpdateEffect'

describe('useUpdateEffect depsChanged', () => {
  it('treats identical dependency values as unchanged (StrictMode re-run)', () => {
    expect(depsChanged(['tenant-a'], ['tenant-a'])).toBe(false)
  })

  it('detects a changed dependency', () => {
    expect(depsChanged(['tenant-a'], ['tenant-b'])).toBe(true)
  })

  it('detects a changed dependency count', () => {
    expect(depsChanged(['a'], ['a', 'b'])).toBe(true)
  })

  it('compares with Object.is', () => {
    expect(depsChanged([NaN], [NaN])).toBe(false)
    expect(depsChanged([{}], [{}])).toBe(true)
  })
})
