import { describe, expect, it } from 'vitest'
import {
  buildPreferencePayload,
  canClear,
  displayValue,
  shouldSkipSave,
  cellText,
  listText,
  preferenceErrorDetails,
  toBoolean,
  toPreferenceValue,
} from './systemPreferences.helpers'

const tokenPref = {
  key: 'openAiApiToken',
  type: 'PASSWORD',
  secured: true,
}

const couponPref = {
  key: 'maxNumberOfCouponsPerCart',
  type: 'NUMBER',
}

describe('buildPreferencePayload', () => {
  it('adds secured true only for a flagged preference', () => {
    expect(
      buildPreferencePayload(tokenPref, 'myVerySecureApiKeyToken')
    ).toEqual({
      key: 'openAiApiToken',
      value: 'myVerySecureApiKeyToken',
      secured: true,
    })
  })

  it('omits secured for a preference that is not flagged', () => {
    expect(buildPreferencePayload(couponPref, 3)).toEqual({
      key: 'maxNumberOfCouponsPerCart',
      value: 3,
    })
    expect(buildPreferencePayload(couponPref, 3)).not.toHaveProperty('secured')
  })

  it('does not mutate the preference', () => {
    const pref = { ...tokenPref }
    const original = { ...pref }
    buildPreferencePayload(pref, 'token')
    expect(pref).toEqual(original)
  })
})

describe('shouldSkipSave', () => {
  it('skips an empty password so a stored token is not overwritten', () => {
    expect(shouldSkipSave(tokenPref, '')).toBe(true)
    expect(shouldSkipSave(tokenPref, undefined)).toBe(true)
    expect(shouldSkipSave(tokenPref, null)).toBe(true)
  })

  it('saves a password that has a value', () => {
    expect(shouldSkipSave(tokenPref, 'token')).toBe(false)
    expect(shouldSkipSave(tokenPref, ' ')).toBe(false)
  })

  it('does not skip an empty non-password preference', () => {
    expect(shouldSkipSave({ type: 'TEXT' }, '')).toBe(false)
    expect(shouldSkipSave({ type: 'BOOLEAN' }, false)).toBe(false)
  })
})

describe('displayValue', () => {
  it('shows an empty cell when the password preference does not exist', () => {
    expect(displayValue({ type: 'PASSWORD', existing: false })).toBe('')
    expect(displayValue({ type: 'PASSWORD' })).toBe('')
  })

  it('masks an existing password preference', () => {
    expect(displayValue({ type: 'PASSWORD', existing: true })).toBe('********')
  })
})

describe('canClear', () => {
  it('allows clearing a secured preference that exists', () => {
    expect(canClear({ secured: true, existing: true })).toBe(true)
  })

  it('does not allow clearing a secured preference that is missing', () => {
    expect(canClear({ secured: true, existing: false })).toBe(false)
    expect(canClear({ secured: true })).toBe(false)
  })

  it('does not allow clearing a preference that is not secured', () => {
    expect(canClear({ existing: true })).toBe(false)
    expect(canClear({ secured: false, existing: true })).toBe(false)
  })
})

describe('toPreferenceValue', () => {
  it('turns a number text into a number', () => {
    expect(toPreferenceValue('NUMBER', '5')).toBe(5)
  })

  it('turns switch text into a boolean', () => {
    expect(toPreferenceValue('BOOLEAN', 'true')).toBe(true)
    expect(toPreferenceValue('BOOLEAN', 'FALSE')).toBe(false)
    expect(toPreferenceValue('BOOLEAN', true)).toBe(true)
  })

  it('splits list text on commas and drops blanks', () => {
    expect(toPreferenceValue('LIST', ' a@x.io, b@x.io ,, ')).toEqual([
      'a@x.io',
      'b@x.io',
    ])
    expect(toPreferenceValue('LIST', '   ')).toEqual([])
    expect(toPreferenceValue('LIST', undefined)).toEqual([])
    expect(toPreferenceValue('LIST', ['a'])).toEqual(['a'])
  })

  it('keeps text, secret and enum values as typed', () => {
    expect(toPreferenceValue('TEXT', 'https://x.io')).toBe('https://x.io')
    expect(toPreferenceValue('PASSWORD', 'secret')).toBe('secret')
    expect(toPreferenceValue('ENUM', 'UPWARD')).toBe('UPWARD')
  })

  it('passes an empty value on unchanged, except for a list', () => {
    expect(toPreferenceValue('NUMBER', '')).toBe('')
    expect(toPreferenceValue('TEXT', undefined)).toBeUndefined()
  })
})

describe('toBoolean', () => {
  it('reads true from a boolean or text, anything else is false', () => {
    expect(toBoolean(true)).toBe(true)
    expect(toBoolean('True')).toBe(true)
    expect(toBoolean('false')).toBe(false)
    expect(toBoolean(undefined)).toBe(false)
    expect(toBoolean(null)).toBe(false)
  })
})

describe('listText', () => {
  it('joins a list with commas and keeps text as it is', () => {
    expect(listText(['a', 'b'])).toBe('a, b')
    expect(listText('a, b')).toBe('a, b')
    expect(listText(undefined)).toBe('')
  })
})

describe('cellText', () => {
  it('shows the stored value, else the default', () => {
    expect(cellText({ type: 'NUMBER', value: 3, defaultValue: '100' })).toBe(
      '3'
    )
    expect(cellText({ type: 'NUMBER', defaultValue: '100' })).toBe('100')
    expect(cellText({ type: 'TEXT' })).toBe('')
  })

  it('joins a list and masks a stored secret', () => {
    expect(cellText({ type: 'LIST', value: ['a', 'b'] })).toBe('a, b')
    expect(cellText({ type: 'PASSWORD', existing: true })).toBe('********')
  })
})

describe('preferenceErrorDetails', () => {
  const apiError = (data: unknown) => ({ response: { data } })

  it('prefers the detail messages', () => {
    expect(
      preferenceErrorDetails(
        apiError({
          message: 'Bad request',
          details: [{ message: 'value must be a number' }, {}],
        })
      )
    ).toEqual(['value must be a number'])
  })

  it('falls back to the message', () => {
    expect(
      preferenceErrorDetails(apiError({ message: 'Bad request', details: [] }))
    ).toBe('Bad request')
  })

  it('has nothing for an error without a response body', () => {
    expect(preferenceErrorDetails(new Error('network'))).toBeUndefined()
    expect(preferenceErrorDetails(null)).toBeUndefined()
  })
})
