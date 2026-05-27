import { describe, expect, it } from 'vitest'

import { PRODUCT_ENTITY_TYPE } from '../types/Tool'
import {
  getRagFilterFieldDisplayLabel,
  isValidRagFieldKey,
  resolveRagEntityType,
  sanitizeRagEmporixFilterFields,
  sanitizeRagEmporixIndexedFields,
} from './ragEmporixToolHelpers'

describe('resolveRagEntityType', () => {
  it('returns product for undefined, empty, and whitespace-only values', () => {
    expect(resolveRagEntityType(undefined)).toBe(PRODUCT_ENTITY_TYPE)
    expect(resolveRagEntityType('')).toBe(PRODUCT_ENTITY_TYPE)
    expect(resolveRagEntityType('   ')).toBe(PRODUCT_ENTITY_TYPE)
  })

  it('returns trimmed custom entity type', () => {
    expect(resolveRagEntityType('  CUSTOM_PRODUCT  ')).toBe('CUSTOM_PRODUCT')
  })
})

describe('isValidRagFieldKey', () => {
  it('accepts valid keys with surrounding whitespace', () => {
    expect(isValidRagFieldKey('  product.id  ')).toBe(true)
  })

  it('rejects empty and undefined values', () => {
    expect(isValidRagFieldKey('   ')).toBe(false)
    expect(isValidRagFieldKey(undefined)).toBe(false)
  })

  it('rejects invalid keys even after trimming', () => {
    expect(isValidRagFieldKey('  invalid key  ')).toBe(false)
  })
})

describe('sanitizeRagEmporixIndexedFields', () => {
  it('keeps valid keys and trims key/name values', () => {
    const fields = [
      { key: '  product.id  ', name: '  Product Id  ' },
      { key: '  invalid key  ', name: 'Should be removed' },
    ]

    expect(sanitizeRagEmporixIndexedFields(fields)).toEqual([
      { key: 'product.id', name: 'Product Id' },
    ])
  })
})

describe('sanitizeRagEmporixFilterFields', () => {
  it('keeps valid keys and trims key/name/description values', () => {
    const fields = [
      {
        key: '  product.category  ',
        name: '  Category  ',
        description: '  Filter by category  ',
      },
      {
        key: ' bad key ',
        name: 'Invalid',
        description: 'Should be removed',
      },
    ]

    expect(sanitizeRagEmporixFilterFields(fields)).toEqual([
      {
        key: 'product.category',
        name: 'Category',
        description: 'Filter by category',
      },
    ])
  })
})

describe('getRagFilterFieldDisplayLabel', () => {
  it('matches metadata using a trimmed key', () => {
    const label = getRagFilterFieldDisplayLabel(
      { key: '  product.category  ' },
      [{ key: 'product.category', name: 'Category' }]
    )

    expect(label).toBe('product.category (Category)')
  })

  it('uses a trimmed key in fallback label when metadata is missing', () => {
    const label = getRagFilterFieldDisplayLabel(
      { key: '  custom.field  ', name: 'Custom Field' },
      []
    )

    expect(label).toBe('custom.field (Custom Field)')
  })
})
