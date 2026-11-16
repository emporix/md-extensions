import { describe, expect, it } from 'vitest'
import { getExpandedIds } from './tables'

describe('getExpandedIds', () => {
  it('reads the ids of the map a table with a dataKey reports', () => {
    expect(getExpandedIds({ a: true, b: true })).toEqual(new Set(['a', 'b']))
  })

  it('reads the ids of expanded rows', () => {
    expect(getExpandedIds([{ id: 'a' }, { id: 'b' }])).toEqual(
      new Set(['a', 'b'])
    )
  })

  it('returns no ids when nothing is expanded', () => {
    expect(getExpandedIds(undefined)).toEqual(new Set())
    expect(getExpandedIds(null)).toEqual(new Set())
  })
})
