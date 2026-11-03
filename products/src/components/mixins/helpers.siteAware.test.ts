import { describe, expect, it } from 'vitest'
import {
  buildMixinFieldRules,
  createForm,
  hasLocalizedContent,
  hasMissingRequiredMixinValues,
  hasMissingRequiredSiteOverlayValues,
  isSiteOverlayKey,
  markDeleteDeep,
  MixinsFormItem,
  MixinsFormItemType,
  mixinStorageKey,
  siteCodeFromStorageKey,
} from './helpers'

const REQUIRED_MSG = 'Required'

describe('mixinStorageKey', () => {
  it('returns the schema id when no site is selected', () => {
    expect(mixinStorageKey('marek_loc_2')).toBe('marek_loc_2')
    expect(mixinStorageKey('marek_loc_2', undefined)).toBe('marek_loc_2')
  })

  it('appends the site code for a site-aware mixin', () => {
    expect(mixinStorageKey('marek_loc_2', 'main')).toBe('marek_loc_2__main')
  })
})

describe('siteCodeFromStorageKey / isSiteOverlayKey', () => {
  it('parses site overlay keys', () => {
    expect(siteCodeFromStorageKey('mix', 'mix__main')).toBe('main')
    expect(siteCodeFromStorageKey('mix', 'mix')).toBeUndefined()
    expect(isSiteOverlayKey('mix', 'mix__de')).toBe(true)
    expect(isSiteOverlayKey('mix', 'mix')).toBe(false)
  })
})

describe('createForm sparse', () => {
  it('leaves leaf values undefined so site overlays stay empty', () => {
    expect(
      createForm(
        [
          {
            key: 'flag',
            type: MixinsFormItemType.boolean,
            name: {},
            isRequired: false,
          },
          {
            key: 'title',
            type: MixinsFormItemType.text,
            name: {},
            isRequired: false,
          },
        ],
        { sparse: true }
      )
    ).toEqual({ flag: undefined, title: undefined })
  })
})

describe('hasMissingRequiredMixinValues', () => {
  it('detects missing required scalars and accepts filled values', () => {
    const items = [
      {
        key: 'title',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: true,
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ title: 'ok' }, items)).toBe(false)
  })

  it('ignores required fields marked for deletion', () => {
    const items = [
      {
        key: 'old',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: true,
        toDelete: true,
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(false)
  })

  it('detects missing required fields inside object-array entries', () => {
    const items = [
      {
        key: 'rows',
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.object,
        name: {},
        isRequired: false,
        items: [
          {
            key: 'title',
            type: MixinsFormItemType.text,
            name: {},
            isRequired: true,
          },
        ],
      },
    ]
    expect(
      hasMissingRequiredMixinValues({ rows: [{ title: '' }] }, items)
    ).toBe(true)
    expect(
      hasMissingRequiredMixinValues({ rows: [{ title: 'ok' }] }, items)
    ).toBe(false)
    expect(
      hasMissingRequiredMixinValues(
        { rows: [{ id: '1', value: { title: '' } }] },
        items
      )
    ).toBe(true)
  })

  it('rejects omitted required objects even when children are optional', () => {
    const items = [
      {
        key: 'address',
        type: MixinsFormItemType.object,
        name: {},
        isRequired: true,
        items: [
          {
            key: 'city',
            type: MixinsFormItemType.text,
            name: {},
            isRequired: false,
          },
        ],
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ address: {} }, items)).toBe(false)
  })

  it('does not require children of an omitted optional object', () => {
    const items = [
      {
        key: 'address',
        type: MixinsFormItemType.object,
        name: {},
        isRequired: false,
        items: [
          {
            key: 'city',
            type: MixinsFormItemType.text,
            name: {},
            isRequired: true,
          },
        ],
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(false)
    expect(hasMissingRequiredMixinValues({ address: {} }, items)).toBe(true)
  })

  it('rejects omitted required object arrays', () => {
    const items = [
      {
        key: 'rows',
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.object,
        name: {},
        isRequired: true,
        items: [
          {
            key: 'title',
            type: MixinsFormItemType.text,
            name: {},
            isRequired: false,
          },
        ],
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ rows: [] }, items)).toBe(false)
  })

  it('rejects empty localized values (v1 array, v2 map, blank langs)', () => {
    const items = [
      {
        key: 'label',
        type: MixinsFormItemType.localized,
        name: {},
        isRequired: true,
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ label: [] }, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ label: {} }, items)).toBe(true)
    expect(hasMissingRequiredMixinValues({ label: { en: '' } }, items)).toBe(
      true
    )
    expect(hasMissingRequiredMixinValues({ label: { en: 'Hi' } }, items)).toBe(
      false
    )
    expect(
      hasMissingRequiredMixinValues(
        { label: [{ language: 'en', value: 'Hi' }] },
        items
      )
    ).toBe(false)
  })
})

describe('hasLocalizedContent', () => {
  it('requires at least one non-blank language string', () => {
    expect(hasLocalizedContent(undefined)).toBe(false)
    expect(hasLocalizedContent([])).toBe(false)
    expect(hasLocalizedContent({})).toBe(false)
    expect(hasLocalizedContent({ en: '  ' })).toBe(false)
    expect(hasLocalizedContent({ en: 'Hi' })).toBe(true)
    expect(hasLocalizedContent([{ language: 'de', value: 'Hallo' }])).toBe(true)
  })
})

describe('hasMissingRequiredSiteOverlayValues', () => {
  const rowItems = [
    {
      key: 'rows',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.object,
      name: {},
      isRequired: false,
      items: [
        {
          key: 'title',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'note',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: false,
        },
      ],
    },
    {
      key: 'label',
      type: MixinsFormItemType.text,
      name: {},
      isRequired: true,
    },
  ]

  it('allows omitted inherited scalars', () => {
    expect(hasMissingRequiredSiteOverlayValues({}, rowItems)).toBe(false)
    expect(
      hasMissingRequiredSiteOverlayValues({ note: 'only' }, rowItems)
    ).toBe(false)
  })

  it('rejects replacement array entries missing required children', () => {
    expect(
      hasMissingRequiredSiteOverlayValues({ rows: [{ note: 'x' }] }, rowItems)
    ).toBe(true)
    expect(
      hasMissingRequiredSiteOverlayValues(
        { rows: [{ title: 'ok', note: 'x' }] },
        rowItems
      )
    ).toBe(false)
  })

  it('rejects explicit empty required scalars in the overlay', () => {
    expect(hasMissingRequiredSiteOverlayValues({ label: '' }, rowItems)).toBe(
      true
    )
  })
})

describe('buildMixinFieldRules', () => {
  const requiredText: MixinsFormItem = {
    key: 'title',
    type: MixinsFormItemType.text,
    name: {},
    isRequired: true,
  }

  it('omits required rules for deleted fields so RHF trigger does not block migration', () => {
    const rules = buildMixinFieldRules(
      { ...requiredText, toDelete: true },
      REQUIRED_MSG
    )
    expect(rules.required).toBeUndefined()
    expect(rules.validate).toBeUndefined()
  })

  it('keeps required rule for editable required fields', () => {
    expect(buildMixinFieldRules(requiredText, REQUIRED_MSG).required).toBe(
      REQUIRED_MSG
    )
  })

  it('omits reference validate when toDelete even if required', () => {
    const rules = buildMixinFieldRules(
      {
        key: 'ref',
        type: MixinsFormItemType.reference,
        name: {},
        isRequired: true,
        toDelete: true,
      },
      REQUIRED_MSG
    )
    expect(rules.validate).toBeUndefined()
  })

  it('skips validation for descendants marked via markDeleteDeep', () => {
    const nested = markDeleteDeep({
      key: 'parent',
      type: MixinsFormItemType.object,
      name: {},
      isRequired: true,
      items: [
        {
          key: 'child',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
      ],
    })
    const child = nested.items?.[0]
    expect(child?.toDelete).toBe(true)
    const rules = buildMixinFieldRules(child as MixinsFormItem, REQUIRED_MSG)
    expect(rules.required).toBeUndefined()
  })
})
