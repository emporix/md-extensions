import { describe, expect, it } from 'vitest'
import {
  buildMixinFieldRules,
  createForm,
  hasLocalizedContent,
  hasMissingRequiredMixinValues,
  hasMissingRequiredSiteOverlayValues,
  isEmptiedLocalizedObjectOverride,
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

  it('validates required children inside a localized OBJECT map', () => {
    const addr: MixinsFormItem = {
      key: 'addr',
      type: MixinsFormItemType.localized,
      name: {},
      isRequired: false,
      localizedObject: true,
      items: [
        {
          key: 'city',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'zip',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: false,
        },
      ],
    }
    const rules = buildMixinFieldRules(addr, REQUIRED_MSG)
    expect(rules.validate?.({ en: { zip: '1' } })).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: { city: 'Berlin' } })).toBe(true)
    expect(rules.validate?.(undefined)).toBe(true)
  })

  it('does not require fields a localized OBJECT has no input for', () => {
    const addr: MixinsFormItem = {
      key: 'addr',
      type: MixinsFormItemType.localized,
      name: {},
      isRequired: false,
      localizedObject: true,
      items: [
        {
          key: 'city',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'tags',
          type: MixinsFormItemType.array,
          arrayType: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'inner',
          type: MixinsFormItemType.localized,
          name: {},
          isRequired: true,
          localizedObject: true,
          items: [
            {
              key: 'street',
              type: MixinsFormItemType.text,
              name: {},
              isRequired: true,
            },
          ],
        },
        {
          key: 'geo',
          type: MixinsFormItemType.object,
          name: {},
          isRequired: false,
          items: [
            {
              key: 'geo.points',
              type: MixinsFormItemType.array,
              arrayType: MixinsFormItemType.object,
              name: {},
              isRequired: true,
              items: [],
            },
          ],
        },
        {
          key: 'raw',
          type: MixinsFormItemType.object,
          name: {},
          isRequired: true,
        },
        {
          key: 'frame',
          type: MixinsFormItemType.object,
          name: {},
          isRequired: true,
          items: [
            {
              key: 'frame.parts',
              type: MixinsFormItemType.array,
              arrayType: MixinsFormItemType.text,
              name: {},
              isRequired: true,
            },
          ],
        },
      ],
    }
    const rules = buildMixinFieldRules(addr, REQUIRED_MSG)
    expect(rules.validate?.({ en: { city: 'Berlin', geo: {} } })).toBe(true)
    expect(
      rules.validate?.({ en: { city: 'Berlin', inner: { de: {} } } })
    ).toBe(true)
    expect(rules.validate?.({ en: { tags: ['a'] } })).toBe(REQUIRED_MSG)
  })

  it('does not require a localized OBJECT none of whose fields can be filled', () => {
    const items: MixinsFormItem[] = [
      {
        key: 'specs',
        type: MixinsFormItemType.localized,
        name: {},
        isRequired: true,
        localizedObject: true,
        items: [
          {
            key: 'parts',
            type: MixinsFormItemType.array,
            arrayType: MixinsFormItemType.text,
            name: {},
            isRequired: true,
          },
        ],
      },
    ]
    expect(hasMissingRequiredMixinValues({}, items)).toBe(false)
    expect(hasMissingRequiredSiteOverlayValues({ specs: {} }, items)).toBe(
      false
    )
  })

  it('skips scalar required rules when sparseInherit is set', () => {
    const city: MixinsFormItem = {
      key: 'city',
      type: MixinsFormItemType.text,
      name: {},
      isRequired: true,
    }
    expect(
      buildMixinFieldRules(city, REQUIRED_MSG, {
        siteOverlay: true,
        sparseInherit: true,
      }).required
    ).toBeUndefined()
    expect(
      buildMixinFieldRules(city, REQUIRED_MSG, {
        siteOverlay: true,
        sparseInherit: false,
      }).required
    ).toBe(REQUIRED_MSG)
  })

  it('validates localized text overlays under sparseInherit', () => {
    const label: MixinsFormItem = {
      key: 'label',
      type: MixinsFormItemType.localized,
      name: {},
      isRequired: true,
    }
    const rules = buildMixinFieldRules(label, REQUIRED_MSG, {
      siteOverlay: true,
      sparseInherit: true,
    })
    expect(rules.validate?.({ en: '' })).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: 'Hi' })).toBe(true)
    expect(rules.validate?.(undefined)).toBe(true)
  })

  it('allows sparse localized OBJECT overlays when siteOverlay is set', () => {
    const addr: MixinsFormItem = {
      key: 'addr',
      type: MixinsFormItemType.localized,
      name: {},
      isRequired: false,
      localizedObject: true,
      items: [
        {
          key: 'city',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'zip',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: false,
        },
      ],
    }
    const rules = buildMixinFieldRules(addr, REQUIRED_MSG, {
      siteOverlay: true,
    })
    expect(rules.validate?.({ en: { zip: '1' } })).toBe(true)
    expect(rules.validate?.({ en: { city: '' } })).toBe(REQUIRED_MSG)
  })

  it('allows emptied required localized OBJECT overlays to inherit under sparseInherit', () => {
    const addr: MixinsFormItem = {
      key: 'addr',
      type: MixinsFormItemType.localized,
      name: {},
      isRequired: true,
      localizedObject: true,
      items: [
        {
          key: 'city',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'zip',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: false,
        },
      ],
    }
    const rules = buildMixinFieldRules(addr, REQUIRED_MSG, {
      siteOverlay: true,
      sparseInherit: true,
    })
    expect(rules.validate?.({})).toBe(true)
    expect(rules.validate?.({ de: null })).toBe(true)
    expect(rules.validate?.({ de: undefined })).toBe(true)
    expect(rules.validate?.(undefined)).toBe(true)
    // Sparse overlay: omitted city inherits; explicit blank city still fails.
    expect(rules.validate?.({ en: { zip: '1' } })).toBe(true)
    expect(rules.validate?.({ en: { city: '' } })).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: {} })).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: { city: 'Berlin' } })).toBe(true)
    expect(hasMissingRequiredSiteOverlayValues({ addr: {} }, [addr])).toBe(
      false
    )
    expect(
      hasMissingRequiredSiteOverlayValues({ addr: { de: null } }, [addr])
    ).toBe(false)
  })

  it('keeps array-of-localized-OBJECT rows strict under siteOverlay', () => {
    const blocks: MixinsFormItem = {
      key: 'blocks',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
      name: {},
      isRequired: true,
      localizedObject: true,
      items: [
        {
          key: 'city',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
        {
          key: 'zip',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: false,
        },
      ],
    }
    const rules = buildMixinFieldRules(blocks, REQUIRED_MSG, {
      siteOverlay: true,
    })
    expect(rules.validate?.({ en: { zip: '1' } })).toBe(REQUIRED_MSG)
    // Row Controller validates one map: emptied `{}` stays strict (not inherit).
    expect(rules.validate?.({})).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: { city: 'Berlin' } })).toBe(true)
  })

  it('validates a single array-of-localized-OBJECT row as a map', () => {
    const blocks: MixinsFormItem = {
      key: 'blocks',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.localized,
      name: {},
      isRequired: false,
      localizedObject: true,
      items: [
        {
          key: 'title',
          type: MixinsFormItemType.text,
          name: {},
          isRequired: true,
        },
      ],
    }
    const rules = buildMixinFieldRules(blocks, REQUIRED_MSG)
    expect(rules.validate?.({ en: { body: 'x' } })).toBe(REQUIRED_MSG)
    expect(rules.validate?.({ en: { title: 'Hi' } })).toBe(true)
  })
})

describe('isEmptiedLocalizedObjectOverride', () => {
  it('detects empty and null/undefined-only maps', () => {
    expect(isEmptiedLocalizedObjectOverride(undefined)).toBe(true)
    expect(isEmptiedLocalizedObjectOverride(null)).toBe(true)
    expect(isEmptiedLocalizedObjectOverride({})).toBe(true)
    expect(isEmptiedLocalizedObjectOverride({ de: null })).toBe(true)
    expect(isEmptiedLocalizedObjectOverride({ de: undefined })).toBe(true)
    expect(isEmptiedLocalizedObjectOverride({ en: {}, de: null })).toBe(false)
    expect(isEmptiedLocalizedObjectOverride({ en: { city: '' } })).toBe(false)
    expect(
      isEmptiedLocalizedObjectOverride([{ language: 'en', value: '' }])
    ).toBe(false)
  })
})
