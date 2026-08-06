import { describe, expect, it } from 'vitest'
import { getEntityDetailPath } from './entityLinkConfig'
import { groupDetailPath } from '../constants/paths'

describe('getEntityDetailPath', () => {
  it('returns hash-relative group detail path for group entities', () => {
    expect(getEntityDetailPath('group', 'group-1')).toBe(
      groupDetailPath('group-1')
    )
  })

  it('returns undefined for employee entities, which have no route here', () => {
    expect(getEntityDetailPath('employee', 'user-1')).toBeUndefined()
  })

  it('returns undefined for unknown entities', () => {
    expect(getEntityDetailPath('product', 'product-1')).toBeUndefined()
    expect(getEntityDetailPath('unknown', 'id-1')).toBeUndefined()
    expect(getEntityDetailPath('group', '')).toBeUndefined()
  })
})
