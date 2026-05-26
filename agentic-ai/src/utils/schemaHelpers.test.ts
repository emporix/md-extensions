import { describe, expect, it } from 'vitest'
import { buildRagEmporixEntityTypeOptions } from '../services/schemaService'
import { PRODUCT_ENTITY_TYPE } from '../types/Tool'

describe('buildRagEmporixEntityTypeOptions', () => {
  it('should include product and custom schema types', () => {
    const options = buildRagEmporixEntityTypeOptions(
      [
        { id: 'CUSTOM_PRODUCT', name: { en: 'Custom Product Type' } },
        { id: 'DOCUMENT', name: { de: 'Dokumente', en: 'Documents' } },
      ],
      'Product',
      'de'
    )

    expect(options).toEqual([
      { label: 'Product', value: PRODUCT_ENTITY_TYPE },
      { label: 'Custom Product Type', value: 'CUSTOM_PRODUCT' },
      { label: 'Dokumente', value: 'DOCUMENT' },
    ])
  })

  it('should fallback to id when localized name is missing', () => {
    const options = buildRagEmporixEntityTypeOptions(
      [{ id: 'NO_NAME', name: {} }],
      'Product',
      'en'
    )

    expect(options[1]).toEqual({ label: 'NO_NAME', value: 'NO_NAME' })
  })
})
