import { describe, expect, it } from 'vitest'
import {
  INHERITABLE_FIELDS,
  persistedOverriddenFields,
  snapshotInheritedValues,
  stripInheritedFields,
} from './inheritableFields.helpers'
import { Product } from '../../models/Category.model'

describe('INHERITABLE_FIELDS', () => {
  it('contains expected fields', () => {
    expect(INHERITABLE_FIELDS).toContain('name')
    expect(INHERITABLE_FIELDS).toContain('published')
    expect(INHERITABLE_FIELDS).toContain('sellable')
    expect(INHERITABLE_FIELDS).toContain('brandId')
    expect(INHERITABLE_FIELDS).toContain('labelIds')
    expect(INHERITABLE_FIELDS).toContain('description')
    expect(INHERITABLE_FIELDS).toContain('media')
    expect(INHERITABLE_FIELDS).toContain('taxClasses')
    expect(INHERITABLE_FIELDS).toContain('relatedItems')
  })
})

describe('snapshotInheritedValues', () => {
  it('snapshots only inheritable fields that exist on the product', () => {
    const product: Partial<Product> = {
      id: 'p-1',
      code: 'CODE',
      name: { en: 'Test' },
      published: true,
      sellable: false,
      brandId: 'brand-1',
    }

    const snapshot = snapshotInheritedValues(product)

    expect(snapshot).toEqual({
      name: { en: 'Test' },
      published: true,
      sellable: false,
      brandId: 'brand-1',
    })
    // Non-inheritable fields excluded
    expect(snapshot).not.toHaveProperty('id')
    expect(snapshot).not.toHaveProperty('code')
  })

  it('skips fields not present on the product', () => {
    const product: Partial<Product> = {
      name: { en: 'Test' },
    }

    const snapshot = snapshotInheritedValues(product)

    expect(snapshot).toEqual({
      name: { en: 'Test' },
    })
    expect(snapshot).not.toHaveProperty('published')
    expect(snapshot).not.toHaveProperty('sellable')
  })

  it('returns empty object for empty product', () => {
    expect(snapshotInheritedValues({})).toEqual({})
  })

  it('includes falsy values (false, empty string)', () => {
    const product: Partial<Product> = {
      published: false,
      sellable: false,
      brandId: '',
    }

    const snapshot = snapshotInheritedValues(product)

    expect(snapshot).toEqual({
      published: false,
      sellable: false,
      brandId: '',
    })
  })
})

describe('persistedOverriddenFields', () => {
  it('uses only product.metadata.overridden, not a live dirty set', () => {
    const product: Partial<Product> = {
      metadata: { overridden: ['published'] },
    }
    const liveDirty = new Set(['name', 'published'])

    const result = persistedOverriddenFields(product)

    expect(result).toEqual(new Set(['published']))
    expect(result.has('name')).toBe(false)
    // Live dirty must not be consulted — mixin-only saves must not bake in unsaved General edits.
    expect(liveDirty.has('name')).toBe(true)
  })

  it('returns an empty set when metadata.overridden is missing', () => {
    expect(persistedOverriddenFields({})).toEqual(new Set())
    expect(persistedOverriddenFields({ metadata: {} })).toEqual(new Set())
  })

  it('lets stripInheritedFields keep inheritance when only live dirty marked name', () => {
    const product: Partial<Product> = {
      name: { en: 'Inherited' },
      published: true,
      metadata: { overridden: [] },
    }
    const overridden = persistedOverriddenFields(product)
    const result = stripInheritedFields(product, overridden)

    expect(result).not.toHaveProperty('name')
    expect(result).not.toHaveProperty('published')
  })
})

describe('stripInheritedFields', () => {
  it('removes non-overridden inheritable fields from payload', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      code: 'CODE',
      name: { en: 'Test' },
      published: true,
      sellable: false,
      brandId: 'brand-1',
      description: { en: 'Desc' },
    }

    const overridden = new Set(['name', 'published'])
    const result = stripInheritedFields(payload, overridden)

    // Overridden fields kept
    expect(result.name).toEqual({ en: 'Test' })
    expect(result.published).toBe(true)

    // Non-overridden inheritable fields removed
    expect(result).not.toHaveProperty('sellable')
    expect(result).not.toHaveProperty('brandId')
    expect(result).not.toHaveProperty('description')

    // Non-inheritable fields always kept
    expect(result.id).toBe('p-1')
    expect(result.code).toBe('CODE')
  })

  it('keeps all fields when everything is overridden', () => {
    const payload: Partial<Product> = {
      name: { en: 'Test' },
      published: true,
      sellable: true,
      brandId: 'b1',
      labelIds: ['l1'],
      description: { en: 'Desc' },
    }

    const overridden = new Set(INHERITABLE_FIELDS as string[])
    const result = stripInheritedFields(payload, overridden)

    expect(result).toEqual(payload)
  })

  it('removes all inheritable fields when none are overridden', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      name: { en: 'Test' },
      published: true,
      sellable: true,
    }

    const overridden = new Set<string>()
    const result = stripInheritedFields(payload, overridden)

    expect(result).toEqual({ id: 'p-1' })
  })

  it('does not mutate the original payload', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      name: { en: 'Test' },
      sellable: true,
    }

    const original = { ...payload }
    stripInheritedFields(payload, new Set())

    expect(payload).toEqual(original)
  })

  it('strips mixins when stripMixins is true and mixins not overridden', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      name: { en: 'Test' },
      mixins: { color: { value: 'red' } },
      metadata: { mixins: { color: 'http://schema.url' } },
    }

    const result = stripInheritedFields(payload, new Set(['name']), true)

    expect(result.name).toEqual({ en: 'Test' })
    expect(result).not.toHaveProperty('mixins')
    expect(result.metadata).not.toHaveProperty('mixins')
  })

  it('keeps mixins when stripMixins is true but mixins is overridden', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      mixins: { color: { value: 'red' } },
      metadata: { mixins: { color: 'http://schema.url' } },
    }

    const result = stripInheritedFields(payload, new Set(['mixins']), true)

    expect(result.mixins).toEqual({ color: { value: 'red' } })
    expect(result.metadata?.mixins).toEqual({ color: 'http://schema.url' })
  })

  it('does not strip mixins when stripMixins is false (default)', () => {
    const payload: Partial<Product> = {
      id: 'p-1',
      mixins: { color: { value: 'red' } },
    }

    const result = stripInheritedFields(payload, new Set())

    expect(result.mixins).toEqual({ color: { value: 'red' } })
  })
})
