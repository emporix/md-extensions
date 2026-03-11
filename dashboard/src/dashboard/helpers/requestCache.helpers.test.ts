import { describe, expect, it } from 'vitest'
import { getOrLoad } from './requestCache.helpers'

describe('getOrLoad', () => {
  it('returns loader result for first call with a key', async () => {
    const loader = async () => 42
    const result = await getOrLoad('key1', loader)
    expect(result).toBe(42)
  })

  it('deduplicates concurrent calls with the same key', async () => {
    let loadCount = 0
    const loader = async () => {
      loadCount += 1
      await new Promise((r) => setTimeout(r, 10))
      return loadCount
    }
    const [a, b, c] = await Promise.all([
      getOrLoad('key2', loader),
      getOrLoad('key2', loader),
      getOrLoad('key2', loader),
    ])
    expect(loadCount).toBe(1)
    expect(a).toBe(1)
    expect(b).toBe(1)
    expect(c).toBe(1)
  })

  it('runs loader again after previous promise settles', async () => {
    let loadCount = 0
    const loader = async () => {
      loadCount += 1
      return loadCount
    }
    const first = await getOrLoad('key3', loader)
    expect(first).toBe(1)
    const second = await getOrLoad('key3', loader)
    expect(second).toBe(2)
  })

  it('does not mutate loader input', async () => {
    const input = { value: 1 }
    const loader = async () => ({ ...input })
    const result = await getOrLoad('key4', loader)
    expect(result).toEqual({ value: 1 })
    expect(input).toEqual({ value: 1 })
  })
})
