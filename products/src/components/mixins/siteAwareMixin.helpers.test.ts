import { describe, expect, it } from 'vitest'
import { MixinsFormItemType } from './helpers'
import {
  areMixinsEqual,
  applyMixinSaveData,
  applySiteArrayOverrideFlags,
  buildSiteAwareSavePatch,
  ensureInitialBindingPatch,
  formatInheritedDisplayValue,
  isContextDirty,
  isDraftDirty,
  listSiteCodesWithOverlay,
  mergeLiveContext,
  migrateSiteAwareDraftsForSchema,
  needsInitialSiteAwareBinding,
  normalizeSiteOverlay,
  seedSiteAwareDrafts,
  SITE_ARRAY_OVERRIDE_FLAGS_KEY,
  stripUndefinedLeaves,
} from './siteAwareMixin.helpers'

describe('siteAwareMixin.helpers', () => {
  describe('areMixinsEqual', () => {
    it('ignores object key insertion order', () => {
      expect(areMixinsEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
      expect(
        areMixinsEqual({ nested: { x: 1, y: 2 } }, { nested: { y: 2, x: 1 } })
      ).toBe(true)
    })

    it('preserves array order', () => {
      expect(areMixinsEqual({ list: [1, 2] }, { list: [2, 1] })).toBe(false)
    })
  })

  describe('seedSiteAwareDrafts', () => {
    it('seeds default and site overlays for the schema', () => {
      const drafts = seedSiteAwareDrafts('mix', {
        mix: { a: 1 },
        mix__main: { a: 2 },
        other: { x: 1 },
      })
      expect(drafts).toEqual({
        mix: { a: 1 },
        mix__main: { a: 2 },
      })
    })

    it('always includes an empty default draft', () => {
      expect(seedSiteAwareDrafts('mix', {})).toEqual({ mix: {} })
    })

    it('skips keys that are registered schemas to avoid __ collisions', () => {
      const drafts = seedSiteAwareDrafts(
        'color',
        {
          color: { hue: 'red' },
          color__main: { brandPalette: 'acme' },
          color__de: { hue: 'blau' },
        },
        ['color', 'color__main']
      )
      expect(drafts).toEqual({
        color: { hue: 'red' },
        color__de: { hue: 'blau' },
      })
      expect(drafts.color__main).toBeUndefined()
    })

    it('still treats matching keys as overlays when not a known schema', () => {
      const drafts = seedSiteAwareDrafts('color', {
        color: { hue: 'red' },
        color__main: { hue: 'blue' },
      })
      expect(drafts).toEqual({
        color: { hue: 'red' },
        color__main: { hue: 'blue' },
      })
    })
  })

  describe('applyMixinSaveData', () => {
    it('deletes null overlay keys in a site-aware batch', () => {
      const next = applyMixinSaveData(
        { mix: { a: 1 }, mix__de: { a: 2, b: 3 } },
        { mix__de: null, mix: { a: 1 } },
        {
          key: 'mix',
          url: 'https://schema/mix',
          version: 1,
          siteAwareBatch: true,
        }
      )
      expect(next).toEqual({ mix: { a: 1 } })
      expect(Object.prototype.hasOwnProperty.call(next, 'mix__de')).toBe(false)
    })

    it('replaces overlay objects so cleared fields are omitted', () => {
      const next = applyMixinSaveData(
        { mix: { a: 1 }, mix__de: { a: 2, b: 3 } },
        { mix__de: { a: 2 } },
        {
          key: 'mix',
          url: 'https://schema/mix',
          version: 1,
          siteAwareBatch: true,
        }
      )
      expect(next).toEqual({ mix: { a: 1 }, mix__de: { a: 2 } })
    })

    it('sets a single storage key when not a batch', () => {
      const next = applyMixinSaveData(
        { mix: { a: 1 } },
        { a: 9 },
        {
          key: 'mix',
          url: 'https://schema/mix',
          version: 1,
          siteCode: 'de',
        }
      )
      expect(next).toEqual({ mix: { a: 1 }, mix__de: { a: 9 } })
    })
  })

  describe('stripUndefinedLeaves', () => {
    it('drops undefined leaves while keeping explicit false/0', () => {
      expect(
        stripUndefinedLeaves({ flag: undefined, count: 0, on: false })
      ).toEqual({ count: 0, on: false })
      expect(
        areMixinsEqual(stripUndefinedLeaves({ flag: undefined }), {})
      ).toBe(true)
    })

    it('strips site array override flags', () => {
      expect(
        stripUndefinedLeaves({
          a: 1,
          [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: { tags: true },
        })
      ).toEqual({ a: 1 })
    })
  })

  describe('applySiteArrayOverrideFlags', () => {
    it('keeps explicit empty overrides and drops inherited materialized arrays', () => {
      expect(
        applySiteArrayOverrideFlags({
          tags: [],
          keep: ['a'],
          nested: { items: [] },
          [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: {
            tags: false,
            keep: true,
            'nested.items': false,
          },
        })
      ).toEqual({ keep: ['a'], nested: {} })
    })

    it('does not mutate caller-owned nested objects when deleting paths', () => {
      const overlay = {
        nested: { items: [] as string[] },
        [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: {
          'nested.items': false,
        },
      }
      const before = JSON.parse(JSON.stringify(overlay))

      const result = applySiteArrayOverrideFlags(overlay)

      expect(overlay).toEqual(before)
      expect(result).toEqual({ nested: {} })
      expect(overlay.nested.items).toEqual([])
    })
  })

  describe('normalizeSiteOverlay', () => {
    it('does not mutate caller-owned nested objects via array override flags', () => {
      const overlay = {
        nested: { items: [] as string[], keep: 'x' },
        [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: {
          'nested.items': false,
        },
      }
      const before = JSON.parse(JSON.stringify(overlay))

      const result = normalizeSiteOverlay(overlay)

      expect(overlay).toEqual(before)
      expect(result).toEqual({ nested: { keep: 'x' } })
    })

    it('drops empty strings, nulls and empty objects but keeps empty arrays', () => {
      expect(
        normalizeSiteOverlay({
          title: '',
          flag: false,
          count: 0,
          nested: { a: null, b: 'x' },
          empty: {},
          list: [],
        })
      ).toEqual({
        flag: false,
        count: 0,
        nested: { b: 'x' },
        list: [],
      })
    })

    it('returns {} when nothing meaningful remains', () => {
      expect(normalizeSiteOverlay({ a: '', b: null, c: {} })).toEqual({})
    })

    it('drops empty reference stubs', () => {
      expect(
        normalizeSiteOverlay({
          ref: { emporixReferenceType: 'product', id: '' },
        })
      ).toEqual({})
    })

    it('preserves an explicit empty-array override', () => {
      expect(normalizeSiteOverlay({ tags: [] })).toEqual({ tags: [] })
      expect(
        normalizeSiteOverlay({
          tags: [],
          [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: { tags: false },
        })
      ).toEqual({})
      expect(
        normalizeSiteOverlay({
          tags: [],
          [SITE_ARRAY_OVERRIDE_FLAGS_KEY]: { tags: true },
        })
      ).toEqual({ tags: [] })
    })

    it('drops empty v1 localized entries as a whole, not language-only stubs', () => {
      expect(
        normalizeSiteOverlay({
          label: [
            { language: 'en', value: 'Hi' },
            { language: 'fr', value: '' },
          ],
        })
      ).toEqual({ label: [{ language: 'en', value: 'Hi' }] })
      // All entries dropped → empty array override (clears inherited translations).
      expect(
        normalizeSiteOverlay({
          label: [{ language: 'fr', value: '' }],
        })
      ).toEqual({ label: [] })
    })

    it('preserves empty object-array rows for validation and keeps extra object fields', () => {
      expect(
        normalizeSiteOverlay({
          rows: [{ title: '' }, { title: 'keep' }],
        })
      ).toEqual({ rows: [{}, { title: 'keep' }] })
      expect(
        normalizeSiteOverlay({
          entry: { language: 'en', value: 'text', source: 'manual' },
        })
      ).toEqual({ entry: { language: 'en', value: 'text', source: 'manual' } })
    })
  })

  describe('mergeLiveContext', () => {
    it('returns the same bag when live matches the stored context', () => {
      const drafts = { mix: { a: 1 }, mix__main: { a: 2 } }
      expect(mergeLiveContext(drafts, 'mix__main', { a: 2 })).toBe(drafts)
    })

    it('merges a changed live payload for the active context', () => {
      const drafts = { mix: { a: 1 }, mix__main: { a: 2 } }
      expect(mergeLiveContext(drafts, 'mix__main', { a: 9 })).toEqual({
        mix: { a: 1 },
        mix__main: { a: 9 },
      })
    })
  })

  describe('listSiteCodesWithOverlay', () => {
    it('returns site codes with non-empty overlays', () => {
      expect(
        listSiteCodesWithOverlay('mix', {
          mix: { a: 1 },
          mix__main: { a: 2 },
          mix__de: {},
        })
      ).toEqual(['main'])
    })
  })

  describe('dirty detection', () => {
    it('detects dirty contexts and overall draft dirty state', () => {
      const baseline = { mix: { a: 1 }, mix__main: { a: 2 } }
      const drafts = { mix: { a: 1 }, mix__main: { a: 3 } }
      expect(isContextDirty('mix', drafts, baseline)).toBe(false)
      expect(isContextDirty('mix__main', drafts, baseline)).toBe(true)
      expect(isDraftDirty('mix', drafts, baseline)).toBe(true)
    })
  })

  describe('buildSiteAwareSavePatch', () => {
    it('includes changed default and nulls cleared overlays', () => {
      const baseline = { mix: { a: 1 }, mix__main: { a: 2 } }
      const drafts = { mix: { a: 9 }, mix__main: {} }
      expect(buildSiteAwareSavePatch('mix', drafts, baseline)).toEqual({
        mix: { a: 9 },
        mix__main: null,
      })
    })

    it('skips unchanged keys', () => {
      const bag = { mix: { a: 1 }, mix__main: { a: 2 } }
      expect(buildSiteAwareSavePatch('mix', bag, bag)).toEqual({})
    })
  })

  describe('migrateSiteAwareDraftsForSchema', () => {
    const items = [
      {
        key: 'keep',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: false,
      },
      {
        key: 'gone',
        type: MixinsFormItemType.text,
        name: {},
        isRequired: false,
        toDelete: true,
      },
      {
        key: 'renamed',
        type: MixinsFormItemType.integer,
        name: {},
        isRequired: false,
        toChange: true,
      },
    ]

    it('strips changed and deleted fields from unvisited overlays', () => {
      const baseline = {
        mix: { keep: 'd', gone: 'x', renamed: 1 },
        mix__main: { keep: 's', gone: 'y', renamed: 2 },
      }
      const drafts = {
        ...baseline,
        other: { keep: 'ignored' },
      }
      const migrated = migrateSiteAwareDraftsForSchema(
        'mix',
        drafts,
        baseline,
        items
      )
      expect(migrated).toEqual({
        mix: { keep: 'd' },
        mix__main: { keep: 's' },
        other: { keep: 'ignored' },
      })
      expect(buildSiteAwareSavePatch('mix', migrated, baseline)).toEqual({
        mix: { keep: 'd' },
        mix__main: { keep: 's' },
      })
    })

    it('preserves re-entered changed fields on touched contexts', () => {
      const baseline = {
        mix: { keep: 'd', gone: 'x', renamed: 1 },
        mix__main: { keep: 's', gone: 'y', renamed: 2 },
      }
      const drafts = {
        mix: { keep: 'd', gone: 'x', renamed: 99 },
        mix__main: baseline.mix__main,
      }
      expect(
        migrateSiteAwareDraftsForSchema(
          'mix',
          drafts,
          baseline,
          items,
          new Set(['mix'])
        )
      ).toEqual({
        mix: { keep: 'd', renamed: 99 },
        mix__main: { keep: 's' },
      })
    })

    it('rewrites unvisited v1 localized overlays to v2 maps', () => {
      const localizedItems = [
        {
          key: 'title',
          type: MixinsFormItemType.localized,
          name: {},
          isRequired: false,
          localizedVersion: 'v2' as const,
        },
      ]
      const baseline = {
        mix: { title: [{ language: 'en', value: 'Hi' }] },
        mix__main: { title: [{ language: 'de', value: 'Hallo' }] },
      }
      const migrated = migrateSiteAwareDraftsForSchema(
        'mix',
        baseline,
        baseline,
        localizedItems
      )
      expect(migrated).toEqual({
        mix: { title: { en: 'Hi' } },
        mix__main: { title: { de: 'Hallo' } },
      })
    })
  })

  describe('needsInitialSiteAwareBinding', () => {
    it('is true when the schema is not yet on the entity', () => {
      expect(needsInitialSiteAwareBinding('mix', [])).toBe(true)
      expect(needsInitialSiteAwareBinding('mix', ['other'])).toBe(true)
      expect(needsInitialSiteAwareBinding('mix', new Set(['other']))).toBe(true)
    })

    it('is false when the schema is already bound', () => {
      expect(needsInitialSiteAwareBinding('mix', ['mix'])).toBe(false)
      expect(
        needsInitialSiteAwareBinding('mix', new Set(['mix', 'other']))
      ).toBe(false)
    })

    it('is false for an empty schema id', () => {
      expect(needsInitialSiteAwareBinding('', [])).toBe(false)
    })
  })

  describe('ensureInitialBindingPatch', () => {
    it('adds an empty default payload when attaching an unbound schema', () => {
      expect(ensureInitialBindingPatch('mix', {}, true)).toEqual({ mix: {} })
    })

    it('does not overwrite an existing default key in the patch', () => {
      expect(ensureInitialBindingPatch('mix', { mix: { a: 1 } }, true)).toEqual(
        { mix: { a: 1 } }
      )
    })

    it('leaves the patch unchanged when binding is not needed', () => {
      expect(ensureInitialBindingPatch('mix', {}, false)).toEqual({})
      expect(
        ensureInitialBindingPatch('mix', { mix__de: null }, false)
      ).toEqual({ mix__de: null })
    })
  })

  describe('formatInheritedDisplayValue', () => {
    it('formats primitives and localized maps', () => {
      expect(formatInheritedDisplayValue(true)).toBe('true')
      expect(formatInheritedDisplayValue('hello')).toBe('hello')
      expect(formatInheritedDisplayValue({ en: 'Hi', de: 'Hallo' })).toBe(
        'en: Hi, de: Hallo'
      )
      expect(formatInheritedDisplayValue(undefined)).toBeUndefined()
    })

    it('formats reference arrays without [object Object]', () => {
      expect(
        formatInheritedDisplayValue([
          { emporixReferenceType: 'product', id: 'p1' },
          { emporixReferenceType: 'product', id: 'p2' },
        ])
      ).toBe('p1, p2')
    })
  })
})
