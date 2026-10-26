import { describe, expect, it } from 'vitest'
import { buildRagEmporixEntityTypeOptions } from '../services/schemaService'
import {
  CUSTOMER_ENTITY_TYPE,
  LEGAL_ENTITY_ENTITY_TYPE,
  ORDER_ENTITY_TYPE,
  PRODUCT_ENTITY_TYPE,
} from '../types/Tool'

describe('buildRagEmporixEntityTypeOptions', () => {
  it('should include predefined entity types and custom schema types', () => {
    const options = buildRagEmporixEntityTypeOptions(
      [
        { id: 'CUSTOM_PRODUCT', name: { en: 'Custom Product Type' } },
        { id: 'DOCUMENT', name: { de: 'Dokumente', en: 'Documents' } },
      ],
      'Product',
      'Order',
      'Customer',
      'Legal Entity',
      'de'
    )

    expect(options).toEqual([
      { label: 'Product', value: PRODUCT_ENTITY_TYPE },
      { label: 'Order', value: ORDER_ENTITY_TYPE },
      { label: 'Customer', value: CUSTOMER_ENTITY_TYPE },
      { label: 'Legal Entity', value: LEGAL_ENTITY_ENTITY_TYPE },
      { label: 'Custom Product Type', value: 'CUSTOM_PRODUCT' },
      { label: 'Dokumente', value: 'DOCUMENT' },
    ])
  })

  it('should fallback to id when localized name is missing', () => {
    const options = buildRagEmporixEntityTypeOptions(
      [{ id: 'NO_NAME', name: {} }],
      'Product',
      'Order',
      'Customer',
      'Legal Entity',
      'en'
    )

    expect(options[4]).toEqual({ label: 'NO_NAME', value: 'NO_NAME' })
  })
})
