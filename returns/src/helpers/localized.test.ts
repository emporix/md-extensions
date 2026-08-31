import { describe, expect, it } from 'vitest'
import { localizedKeysToLowerCase } from './localized'

describe('localizedKeysToLowerCase', () => {
  it('returns undefined and null unchanged', () => {
    expect(localizedKeysToLowerCase(undefined)).toBeUndefined()
    expect(localizedKeysToLowerCase(null)).toBeNull()
  })

  it('returns strings unchanged', () => {
    expect(localizedKeysToLowerCase('plain text')).toBe('plain text')
  })

  it('lowercases locale keys including region subtags', () => {
    expect(
      localizedKeysToLowerCase({
        en: 'English',
        'de-AT': 'Austrian German',
      })
    ).toEqual({
      en: 'English',
      'de-at': 'Austrian German',
    })
  })
})
