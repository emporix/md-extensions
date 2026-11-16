import { describe, expect, it } from 'vitest'
import { getValueFromPath } from './tree'

describe('getValueFromPath', () => {
  const row = {
    mixins: {
      warranty: '2 years',
      nested: { inner: 1 },
      zero: 0,
      off: false,
    },
  }

  it('reads a nested dot path', () => {
    expect(getValueFromPath(row, 'mixins.warranty')).toBe('2 years')
    expect(getValueFromPath(row, 'mixins.nested.inner')).toBe(1)
  })

  it('keeps falsy-but-valid leaf values', () => {
    expect(getValueFromPath(row, 'mixins.zero')).toBe(0)
    expect(getValueFromPath(row, 'mixins.off')).toBe(false)
  })

  it('returns undefined when a segment is missing', () => {
    expect(getValueFromPath(row, 'mixins.missing')).toBeUndefined()
    expect(getValueFromPath(row, 'mixins.nested.missing.deep')).toBeUndefined()
  })

  it('returns undefined for an empty or non-string path', () => {
    expect(getValueFromPath(row, '')).toBeUndefined()
    expect(getValueFromPath(row, null as unknown as string)).toBeUndefined()
  })

  it('returns undefined when the root is not an object', () => {
    expect(getValueFromPath(null, 'mixins.warranty')).toBeUndefined()
    expect(getValueFromPath('plain', 'mixins.warranty')).toBeUndefined()
  })
})
