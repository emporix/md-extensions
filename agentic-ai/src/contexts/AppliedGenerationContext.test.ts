import { describe, expect, it } from 'vitest'
import { pendingAfterScopeChange } from '../utils/aiProvenance'

describe('pendingAfterScopeChange', () => {
  it('keeps pending generations while the entity id stays the same', () => {
    expect(pendingAfterScopeChange(['gen-1'], 'agent-a', 'agent-a')).toEqual([
      'gen-1',
    ])
  })

  it('drops pending generations when the route opens another entity', () => {
    expect(pendingAfterScopeChange(['gen-1'], 'agent-a', 'agent-b')).toEqual([])
  })
})
