import { describe, expect, it } from 'vitest'
import { SYSTEM_PREFERENCES } from './systemPreferences'
import en from '../translations/en/systemPreferences'
import de from '../translations/de/systemPreferences'

const entryOf = (key: string) => {
  const entry = SYSTEM_PREFERENCES.find((preference) => preference.key === key)
  if (!entry) throw new Error(`no preference ${key}`)
  return entry
}

const translate = (bundle: unknown, path: string) =>
  path
    .split('.')
    .slice(1)
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      bundle
    )

describe('system preferences list', () => {
  it('lists every MD preference once, in MD order', () => {
    const keys = SYSTEM_PREFERENCES.map((preference) => preference.key)
    expect(keys).toHaveLength(32)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys[0]).toBe('openAiApiToken')
    expect(keys.at(-1)).toBe('webhookNotificationEmails')
  })

  it('gives every enum its options and a default among them', () => {
    for (const preference of SYSTEM_PREFERENCES.filter(
      (p) => p.type === 'ENUM'
    )) {
      expect(preference.options?.length).toBeGreaterThan(0)
      expect(preference.options).toContain(preference.defaultValue)
    }
  })

  it('stores only the OpenAI token as a secured secret', () => {
    expect(
      SYSTEM_PREFERENCES.filter((p) => p.secured).map((p) => p.key)
    ).toEqual(['openAiApiToken'])
    expect(entryOf('openAiApiToken').type).toBe('PASSWORD')
  })

  it.each([
    ['en', en],
    ['de', de],
  ])(
    'has a %s name for every preference and a text for every description',
    (_, bundle) => {
      for (const preference of SYSTEM_PREFERENCES) {
        expect(translate(bundle, preference.nameKey)).toBeTruthy()
        if (preference.descriptionKey) {
          expect(translate(bundle, preference.descriptionKey)).toBeTruthy()
        }
      }
    }
  )
})

describe('deleteAvailabilitiesOnSiteDeletion system preference', () => {
  const KEY = 'deleteAvailabilitiesOnSiteDeletion'

  it('lists the boolean setting as off by default', () => {
    expect(entryOf(KEY)).toEqual({
      key: KEY,
      nameKey: `systemPreferences.preferences.${KEY}.name`,
      type: 'BOOLEAN',
      defaultValue: 'false',
      descriptionKey: `systemPreferences.preferences.${KEY}.description`,
    })
  })

  it('has the English name and description', () => {
    expect(en.preferences[KEY].name).toBe(
      'Delete availabilities when a site is deleted'
    )
    expect(en.preferences[KEY].description).toBe(
      "When this is on, deleting a site removes that site's product availabilities. When this is off, those availabilities stay."
    )
  })

  it('has the German name and description', () => {
    expect(de.preferences[KEY].name).toBe(
      'Verfügbarkeiten löschen, wenn eine Site gelöscht wird'
    )
    expect(de.preferences[KEY].description).toBe(
      'Wenn dies aktiv ist, entfernt das Löschen einer Site die Produktverfügbarkeiten dieser Site. Wenn dies aus ist, bleiben diese Verfügbarkeiten erhalten.'
    )
  })
})

describe('webhook system preferences', () => {
  it('lists the failure threshold as a number that defaults to 100', () => {
    const entry = entryOf('webhookFailureThreshold')

    expect(entry.type).toBe('NUMBER')
    expect(entry.defaultValue).toBe('100')
    expect(entry.nameKey).toBe(
      'systemPreferences.preferences.webhookFailureThreshold.name'
    )
    expect(entry.descriptionKey).toBe(
      'systemPreferences.preferences.webhookFailureThreshold.description'
    )
  })

  it('lists the notification emails as a list without a default', () => {
    const entry = entryOf('webhookNotificationEmails')

    expect(entry.type).toBe('LIST')
    expect(entry).not.toHaveProperty('defaultValue')
    expect(entry.nameKey).toBe(
      'systemPreferences.preferences.webhookNotificationEmails.name'
    )
    expect(entry.descriptionKey).toBe(
      'systemPreferences.preferences.webhookNotificationEmails.description'
    )
  })

  it.each([
    ['en', en],
    ['de', de],
  ])('has %s names and descriptions', (_, translations) => {
    for (const key of [
      'webhookFailureThreshold',
      'webhookNotificationEmails',
    ] as const) {
      expect(translations.preferences[key].name).toBeTruthy()
      expect(translations.preferences[key].description).toBeTruthy()
    }
  })
})
