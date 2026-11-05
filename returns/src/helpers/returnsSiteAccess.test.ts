import { describe, expect, it } from 'vitest'
import {
  isReturnsSiteRestricted,
  returnsSiteRestrictions,
} from './returnsSiteAccess'

describe('returnsSiteRestrictions', () => {
  it('returns null for an unrestricted returns read scope', () => {
    expect(returnsSiteRestrictions(['returns.returns_read'])).toBeNull()
    expect(isReturnsSiteRestricted('Site2', ['returns.returns_read'])).toBe(
      false
    )
  })

  it('allows only the sites named after the scope suffix', () => {
    const scopes = ['returns.returns_read--main#TST']

    expect(returnsSiteRestrictions(scopes)).toEqual(['main', 'TST'])
    expect(isReturnsSiteRestricted('Site2', scopes)).toBe(true)
    expect(isReturnsSiteRestricted('main', scopes)).toBe(false)
    expect(isReturnsSiteRestricted('TST', scopes)).toBe(false)
  })

  it('does not treat a blank site code as restricted', () => {
    const scopes = ['returns.returns_read--main']

    expect(isReturnsSiteRestricted('  ', scopes)).toBe(false)
    expect(isReturnsSiteRestricted(undefined, scopes)).toBe(false)
  })

  it('does not treat an own-returns scope as a site list', () => {
    expect(returnsSiteRestrictions(['returns.returns_read_own'])).toBeNull()
    expect(isReturnsSiteRestricted('Site2', ['returns.returns_read_own'])).toBe(
      false
    )
  })

  it('uses the first suffixed scope when read and manage both name sites', () => {
    const scopes = ['returns.returns_manage--main', 'returns.returns_read--DE']

    expect(returnsSiteRestrictions(scopes)).toEqual(['DE'])
    expect(isReturnsSiteRestricted('main', scopes)).toBe(true)
    expect(isReturnsSiteRestricted('DE', scopes)).toBe(false)
  })
})
