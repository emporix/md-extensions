import { describe, expect, it } from 'vitest'
import {
  isFormDirty,
  nextBaselineAfterSilentUpdate,
  toFormSnapshot,
} from './formDirty'

describe('toFormSnapshot', () => {
  it('returns a stable snapshot for the same value', () => {
    const value = { id: 'agent-1', name: 'Support' }

    expect(toFormSnapshot(value)).toBe(toFormSnapshot({ ...value }))
  })

  it('does not mutate the input', () => {
    const value = { id: '', tags: ['a'] }
    const original = structuredClone(value)

    toFormSnapshot(value)

    expect(value).toEqual(original)
  })
})

describe('isFormDirty', () => {
  it('is clean before a baseline exists', () => {
    expect(isFormDirty({ name: '' }, null)).toBe(false)
  })

  it('is clean when the form matches the baseline', () => {
    const current = { name: 'Support' }

    expect(isFormDirty(current, toFormSnapshot(current))).toBe(false)
  })

  it('is dirty when the form differs from the baseline', () => {
    expect(isFormDirty({ name: 'Support' }, toFormSnapshot({ name: '' }))).toBe(
      true
    )
  })

  it('treats an empty string as a real value', () => {
    expect(isFormDirty({ name: '' }, toFormSnapshot({ name: 'Support' }))).toBe(
      true
    )
  })
})

describe('nextBaselineAfterSilentUpdate', () => {
  it('follows a silent update when the form was clean', () => {
    const previous = { name: '', provider: '' }
    const next = { name: '', provider: 'emporix_openai' }

    expect(
      nextBaselineAfterSilentUpdate(toFormSnapshot(previous), previous, next)
    ).toBe(toFormSnapshot(next))
  })

  it('keeps the baseline when the user already changed the form', () => {
    const baseline = toFormSnapshot({ name: '', provider: '' })
    const previous = { name: 'Support', provider: '' }
    const next = { name: 'Support', provider: 'emporix_openai' }

    expect(nextBaselineAfterSilentUpdate(baseline, previous, next)).toBe(
      baseline
    )
  })

  it('captures the first silent update when no baseline exists', () => {
    const next = { name: '' }

    expect(nextBaselineAfterSilentUpdate(null, { name: 'old' }, next)).toBe(
      toFormSnapshot(next)
    )
  })
})
