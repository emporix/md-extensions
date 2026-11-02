import { describe, expect, it } from 'vitest'
import {
  applyScopeLoadResult,
  beginScopeLoad,
  finishScopeLoad,
  scopeIdentityKey,
  visibleScopeLoad,
  type ScopeLoadState,
} from './scopeLoad'

const keyA = scopeIdentityKey('tenant', 'token-a')
const keyB = scopeIdentityKey('tenant', 'token-b')

describe('scopeLoad', () => {
  it('hides the previous token scopes on the render before the next load starts', () => {
    const stored: ScopeLoadState<string> = {
      key: keyA,
      scopes: ['old'],
      loading: false,
      failed: false,
    }

    expect(visibleScopeLoad(stored, 'tenant', 'token-b')).toEqual({
      scopes: [],
      loading: true,
      failed: false,
    })
  })

  it('drops a result that resolves after the token changes', () => {
    const started = beginScopeLoad<string>(keyA)
    const switched = beginScopeLoad<string>(keyB)
    const resolved = applyScopeLoadResult(switched, keyA, keyB, {
      ok: true,
      scopes: ['old'],
    })
    const finished = finishScopeLoad(resolved, keyA, keyB)

    expect(started.scopes).toEqual([])
    expect(resolved).toBe(switched)
    expect(finished).toBe(switched)
    expect(finished).toEqual({
      key: keyB,
      scopes: [],
      loading: true,
      failed: false,
    })
  })

  it('drops an error that rejects after the token changes', () => {
    const switched = beginScopeLoad<string>(keyB)
    const rejected = applyScopeLoadResult(switched, keyA, keyB, { ok: false })
    const finished = finishScopeLoad(rejected, keyA, keyB)

    expect(rejected).toBe(switched)
    expect(finished).toBe(switched)
    expect(finished.failed).toBe(false)
  })

  it('keeps a result whose token is still current', () => {
    const started = beginScopeLoad<string>(keyA)
    const resolved = applyScopeLoadResult(started, keyA, keyA, {
      ok: true,
      scopes: ['ai.agent_manage'],
    })

    expect(resolved).toEqual({
      key: keyA,
      scopes: ['ai.agent_manage'],
      loading: false,
      failed: false,
    })
    expect(finishScopeLoad(resolved, keyA, keyA)).toBe(resolved)
  })
})
