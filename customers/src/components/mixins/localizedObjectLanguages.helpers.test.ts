import { describe, expect, it } from 'vitest'
import { MixinsFormItem, MixinsFormItemType } from './helpers'
import {
  clearLocalizedObjectLanguage,
  editLocalizedObjectField,
  getLanguagesMissingRequired,
  getLanguagesWithContent,
  getLanguagesWithEditableContent,
  getLocalizedObjectSummary,
  orderLocalizedLanguages,
  pruneEditedField,
} from './localizedObjectLanguages.helpers'

const textField = (key: string, isRequired = false): MixinsFormItem => ({
  name: key,
  key,
  type: MixinsFormItemType.text,
  isRequired,
})

const localizedObject = (items: MixinsFormItem[]): MixinsFormItem => ({
  name: 'Marketing',
  key: 'marketing',
  type: MixinsFormItemType.localized,
  isRequired: false,
  localizedObject: true,
  localizedVersion: 'v2',
  items,
})

describe('orderLocalizedLanguages', () => {
  it('puts the content language first and keeps the configured order', () => {
    expect(orderLocalizedLanguages(['en', 'de', 'fr'], [], 'de')).toEqual([
      'de',
      'en',
      'fr',
    ])
  })

  it('appends languages that exist only in stored values', () => {
    expect(
      orderLocalizedLanguages(
        ['en'],
        [{ it: { city: 'Roma' } }, { en: { city: 'Rome' }, pl: null }],
        'en'
      )
    ).toEqual(['en', 'it', 'pl'])
  })

  it('ignores a content language that is neither configured nor stored', () => {
    expect(orderLocalizedLanguages(['en', 'de'], [undefined], 'fr')).toEqual([
      'en',
      'de',
    ])
  })

  it('returns no languages when nothing is configured or stored', () => {
    expect(orderLocalizedLanguages([], [null], null)).toEqual([])
  })

  it('keeps the selected language after its last value is cleared', () => {
    expect(orderLocalizedLanguages(['en'], [{ en: {} }], 'en', 'it')).toEqual([
      'en',
      'it',
    ])
  })
})

describe('clearLocalizedObjectLanguage', () => {
  const value = { en: { city: 'Rome' }, de: { city: 'Rom' } }
  const cityOnly = [textField('city')]

  it('removes the language', () => {
    expect(clearLocalizedObjectLanguage(value, 'de', false, cityOnly)).toEqual({
      en: { city: 'Rome' },
    })
  })

  it('sets the language to null for nullable items', () => {
    expect(clearLocalizedObjectLanguage(value, 'de', true, cityOnly)).toEqual({
      en: { city: 'Rome' },
      de: null,
    })
  })

  it('returns an empty map when the last language is cleared', () => {
    expect(
      clearLocalizedObjectLanguage(
        { de: { city: 'Rom' } },
        'de',
        false,
        cityOnly
      )
    ).toEqual({})
  })

  it('accepts a missing value', () => {
    expect(
      clearLocalizedObjectLanguage(undefined, 'de', false, cityOnly)
    ).toEqual({})
  })

  it('does not mutate the input', () => {
    clearLocalizedObjectLanguage(value, 'de', false, cityOnly)
    expect(value).toEqual({ en: { city: 'Rome' }, de: { city: 'Rom' } })
  })

  describe('with the item fields', () => {
    const children: MixinsFormItem[] = [
      textField('title'),
      { ...textField('code'), isReadonly: true },
      { ...textField('legacy'), toDelete: true },
      {
        name: 'Tags',
        key: 'tags',
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.text,
        isRequired: false,
      },
      {
        ...localizedObject([textField('city')]),
        key: 'inner',
      },
      {
        name: 'Geo',
        key: 'geo',
        type: MixinsFormItemType.object,
        isRequired: false,
        items: [textField('lat'), { ...textField('ref'), isReadonly: true }],
      },
      {
        name: 'Color',
        key: 'color',
        type: MixinsFormItemType.unknown,
        isRequired: false,
      },
      {
        name: 'Raw',
        key: 'raw',
        type: MixinsFormItemType.object,
        isRequired: false,
      },
      {
        name: 'Box',
        key: 'box',
        type: MixinsFormItemType.object,
        isRequired: false,
        items: [textField('width')],
      },
    ]

    it('keeps the values the user cannot edit', () => {
      expect(
        clearLocalizedObjectLanguage(
          {
            de: {
              title: 'Titel',
              code: 'C-1',
              legacy: 'old',
              tags: ['a'],
              inner: { en: { city: 'Rome' } },
              geo: { lat: '1', ref: 'R-1' },
              color: 'red',
              raw: { any: 1 },
              box: 'legacy box',
              stale: 'x',
            },
          },
          'de',
          true,
          children
        )
      ).toEqual({
        de: {
          code: 'C-1',
          legacy: 'old',
          tags: ['a'],
          inner: { en: { city: 'Rome' } },
          geo: { ref: 'R-1' },
          color: 'red',
          raw: { any: 1 },
          box: 'legacy box',
          stale: 'x',
        },
      })
    })

    it('drops blank values it cannot edit, so the language can go', () => {
      const value = {
        de: {
          title: 'Titel',
          code: '',
          tags: [],
          raw: {},
          box: null,
          stale: null,
        },
      }

      expect(
        clearLocalizedObjectLanguage(value, 'de', false, children)
      ).toEqual({})
      expect(clearLocalizedObjectLanguage(value, 'de', true, children)).toEqual(
        { de: null }
      )
    })

    it('keeps a non-object value stored where a nested object goes', () => {
      expect(
        clearLocalizedObjectLanguage(
          { de: { title: 'Titel', box: 'legacy box' } },
          'de',
          false,
          children
        )
      ).toEqual({ de: { box: 'legacy box' } })
    })

    it('removes the language when only editable values were there', () => {
      expect(
        clearLocalizedObjectLanguage(
          { de: { title: 'Titel', geo: { lat: '1' } } },
          'de',
          false,
          children
        )
      ).toEqual({})
    })
  })
})

describe('getLanguagesWithEditableContent', () => {
  const children: MixinsFormItem[] = [
    textField('title'),
    { ...textField('code'), isReadonly: true },
  ]

  it('skips languages whose only values are read-only', () => {
    expect(
      getLanguagesWithEditableContent(
        {
          en: { title: 'Sole', code: 'S-1' },
          de: { code: 'S-1-DE' },
          fr: { title: '' },
          pl: null,
        },
        children
      )
    ).toEqual(['en'])
  })

  it('skips values the form does not let the user edit', () => {
    expect(
      getLanguagesWithEditableContent(
        {
          de: { stale: 'x' },
          fr: { color: 'red' },
          it: { raw: { any: 1 } },
          es: { box: 'legacy box' },
        },
        [
          ...children,
          {
            name: 'Color',
            key: 'color',
            type: MixinsFormItemType.unknown,
            isRequired: false,
          },
          {
            name: 'Raw',
            key: 'raw',
            type: MixinsFormItemType.object,
            isRequired: false,
          },
          {
            name: 'Box',
            key: 'box',
            type: MixinsFormItemType.object,
            isRequired: false,
            items: [textField('width')],
          },
        ]
      )
    ).toEqual([])
  })
})

describe('getLanguagesWithContent', () => {
  it('lists languages with at least one non-blank value', () => {
    expect(
      getLanguagesWithContent({
        en: { city: 'Rome' },
        de: { city: '' },
        fr: null,
        it: { geo: { lat: '1' } },
      })
    ).toEqual(['en', 'it'])
  })

  it('returns no languages for a missing value', () => {
    expect(getLanguagesWithContent(undefined)).toEqual([])
  })
})

describe('getLanguagesMissingRequired', () => {
  const item = localizedObject([
    textField('headline', true),
    textField('badge'),
  ])

  it('lists languages that miss a required field', () => {
    expect(
      getLanguagesMissingRequired(item, {
        en: { headline: 'Hi' },
        de: { badge: 'Neu' },
        fr: { headline: '', badge: 'Nouveau' },
      })
    ).toEqual(['de', 'fr'])
  })

  it('skips null languages', () => {
    expect(
      getLanguagesMissingRequired(item, { en: { headline: 'Hi' }, de: null })
    ).toEqual([])
  })

  it('lets a site overlay omit a required field', () => {
    expect(
      getLanguagesMissingRequired(item, { de: { badge: 'Neu' } }, true)
    ).toEqual([])
  })

  it('flags a required field that a site overlay leaves blank', () => {
    expect(
      getLanguagesMissingRequired(
        item,
        { de: { headline: '', badge: 'Neu' } },
        true
      )
    ).toEqual(['de'])
  })
})

describe('editLocalizedObjectField', () => {
  it('writes a value next to the other fields', () => {
    expect(
      editLocalizedObjectField({ en: { city: 'Rome' } }, 'en', ['zip'], '1')
    ).toEqual({ en: { city: 'Rome', zip: '1' } })
  })

  it('drops a cleared field', () => {
    expect(
      editLocalizedObjectField(
        { en: { city: 'Rome', zip: '1' } },
        'en',
        ['zip'],
        ''
      )
    ).toEqual({ en: { city: 'Rome' } })
  })

  it('changes nothing when a field that holds nothing is cleared', () => {
    expect(
      editLocalizedObjectField(
        { en: { box: 'legacy box' } },
        'en',
        ['box', 'width'],
        null
      )
    ).toBeUndefined()
    expect(
      editLocalizedObjectField(
        { en: { city: 'Rome' } },
        'de',
        ['city'],
        '',
        true
      )
    ).toBeUndefined()
  })

  it('replaces a non-object value once a field inside it is filled', () => {
    expect(
      editLocalizedObjectField(
        { en: { box: 'legacy box' } },
        'en',
        ['box', 'width'],
        '10'
      )
    ).toEqual({ en: { box: { width: '10' } } })
  })

  it('does not mutate the input', () => {
    const value = { en: { city: 'Rome' } }
    editLocalizedObjectField(value, 'en', ['city'], 'Milan')
    expect(value).toEqual({ en: { city: 'Rome' } })
  })
})

describe('pruneEditedField', () => {
  it('drops a blank edited field and keeps the other fields', () => {
    expect(
      pruneEditedField({ de: { headline: '', badge: 'Neu' } }, 'de', [
        'headline',
      ])
    ).toEqual({ de: { badge: 'Neu' } })
  })

  it('drops a nested parent and the language once they are empty', () => {
    expect(
      pruneEditedField(
        { en: { headline: 'Hi' }, de: { cta: { label: null } } },
        'de',
        ['cta', 'label']
      )
    ).toEqual({ en: { headline: 'Hi' } })
  })

  it('sets an emptied language to null when asked to', () => {
    expect(
      pruneEditedField(
        { en: { headline: 'Hi' }, de: { headline: '' } },
        'de',
        ['headline'],
        true
      )
    ).toEqual({ en: { headline: 'Hi' }, de: null })
  })

  it('treats a whitespace-only text as blank', () => {
    expect(
      pruneEditedField({ de: { headline: '  ' } }, 'de', ['headline'])
    ).toEqual({})
  })

  it('keeps an edited value that is not blank', () => {
    const map = { de: { count: 0, active: false } }
    expect(pruneEditedField(map, 'de', ['count'])).toBe(map)
    expect(pruneEditedField(map, 'de', ['active'])).toBe(map)
  })

  it('leaves fields it did not edit as stored, including nested localized values', () => {
    expect(
      pruneEditedField(
        { de: { city: '', inner: { en: { city: '' }, fr: null } } },
        'de',
        ['city']
      )
    ).toEqual({ de: { inner: { en: { city: '' }, fr: null } } })
  })

  it('leaves other languages as stored, even without content', () => {
    expect(
      pruneEditedField(
        { en: { city: '' }, de: { city: '' }, fr: { tags: [] } },
        'en',
        ['city'],
        true
      )
    ).toEqual({ en: null, de: { city: '' }, fr: { tags: [] } })
  })

  it('does not mutate the input', () => {
    const map = { de: { headline: '', cta: { label: '' } } }
    pruneEditedField(map, 'de', ['cta', 'label'])
    expect(map).toEqual({ de: { headline: '', cta: { label: '' } } })
  })
})

describe('getLocalizedObjectSummary', () => {
  const item = localizedObject([textField('title'), textField('text')])

  it('prefers a required text field', () => {
    const withRequired = localizedObject([
      textField('description'),
      textField('title', true),
    ])
    expect(
      getLocalizedObjectSummary(
        withRequired,
        { en: { description: 'Body', title: 'Sole' } },
        ['en']
      )
    ).toBe('Sole')
  })

  it('reads the first text field in the first language that has it', () => {
    expect(
      getLocalizedObjectSummary(
        item,
        { en: { title: '', text: 'Body' }, de: { title: 'Titel' } },
        ['en', 'de']
      )
    ).toBe('Titel')
  })

  it('falls back to the next text field', () => {
    expect(
      getLocalizedObjectSummary(item, { en: { text: 'Body' } }, ['en', 'de'])
    ).toBe('Body')
  })

  it('skips fields that are not text or are marked for deletion', () => {
    const withOtherFields = localizedObject([
      { ...textField('old'), toDelete: true },
      {
        name: 'Count',
        key: 'count',
        type: MixinsFormItemType.integer,
        isRequired: false,
      },
      textField('title'),
    ])
    expect(
      getLocalizedObjectSummary(
        withOtherFields,
        { en: { old: 'Old', count: 3, title: 'New' } },
        ['en']
      )
    ).toBe('New')
  })

  it('returns an empty string when there is no text', () => {
    expect(getLocalizedObjectSummary(item, null, ['en'])).toBe('')
  })
})
