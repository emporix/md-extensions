import { describe, expect, it } from 'vitest'
import {
  AttributeFormValues,
  attributeToFormValues,
  defaultFormValues,
  defaultQualifierForType,
  formValuesToAttribute,
  VALUE_TYPES,
} from './attribute.helpers'
import { DynamicVariantAttribute } from '../../models/Category.model'

describe('VALUE_TYPES', () => {
  it('contains all expected types', () => {
    expect(VALUE_TYPES).toEqual(['STRING', 'NUMBER', 'DECIMAL', 'BOOLEAN'])
  })
})

describe('defaultFormValues', () => {
  it('returns correct defaults', () => {
    const values = defaultFormValues()
    expect(values).toEqual({
      attributeKey: '',
      attributeName: undefined,
      valueType: 'STRING',
      qualifier: '',
      valueLabel: undefined,
      unit: '',
    })
  })

  it('returns a new object each time', () => {
    expect(defaultFormValues()).not.toBe(defaultFormValues())
  })
})

describe('formValuesToAttribute', () => {
  it('converts string attribute', () => {
    const form: AttributeFormValues = {
      attributeKey: 'color',
      attributeName: { en: 'Color' },
      valueType: 'STRING',
      qualifier: 'red',
      valueLabel: { en: 'Red' },
      unit: '',
    }

    const { key, attr } = formValuesToAttribute(form)

    expect(key).toBe('color')
    expect(attr.name).toEqual({ en: 'Color' })
    expect(attr.value.type).toBe('STRING')
    expect(attr.value.qualifier).toBe('red')
    expect(attr.value.name).toEqual({ en: 'Red' })
    expect(attr.value).not.toHaveProperty('unit')
  })

  it('converts boolean qualifier to actual boolean', () => {
    const form: AttributeFormValues = {
      attributeKey: 'organic',
      attributeName: { en: 'Organic' },
      valueType: 'BOOLEAN',
      qualifier: 'truthy-string',
      valueLabel: undefined,
      unit: '',
    }

    const { attr } = formValuesToAttribute(form)
    expect(attr.value.qualifier).toBe(true)
  })

  it('converts falsy boolean qualifier to false', () => {
    const form: AttributeFormValues = {
      attributeKey: 'organic',
      attributeName: undefined,
      valueType: 'BOOLEAN',
      qualifier: '',
      valueLabel: undefined,
      unit: '',
    }

    const { attr } = formValuesToAttribute(form)
    expect(attr.value.qualifier).toBe(false)
  })

  it('includes unit when provided', () => {
    const form: AttributeFormValues = {
      attributeKey: 'weight',
      attributeName: { en: 'Weight' },
      valueType: 'NUMBER',
      qualifier: 500,
      valueLabel: undefined,
      unit: 'g',
    }

    const { attr } = formValuesToAttribute(form)
    expect(attr.value.unit).toBe('g')
  })

  it('trims the attribute key', () => {
    const form: AttributeFormValues = {
      attributeKey: '  color  ',
      attributeName: undefined,
      valueType: 'STRING',
      qualifier: 'red',
      valueLabel: undefined,
      unit: '',
    }

    const { key } = formValuesToAttribute(form)
    expect(key).toBe('color')
  })
})

describe('attributeToFormValues', () => {
  it('maps attribute back to form values', () => {
    const attr: DynamicVariantAttribute = {
      name: { en: 'Color' },
      value: {
        type: 'STRING',
        qualifier: 'red',
        name: { en: 'Red' },
        unit: 'cm',
      },
    }

    const form = attributeToFormValues('color', attr)

    expect(form).toEqual({
      attributeKey: 'color',
      attributeName: { en: 'Color' },
      valueType: 'STRING',
      qualifier: 'red',
      valueLabel: { en: 'Red' },
      unit: 'cm',
    })
  })

  it('handles missing optional fields', () => {
    const attr: DynamicVariantAttribute = {
      value: {
        type: 'NUMBER',
        qualifier: 42,
      },
    }

    const form = attributeToFormValues('size', attr)

    expect(form.attributeKey).toBe('size')
    expect(form.attributeName).toBeUndefined()
    expect(form.valueType).toBe('NUMBER')
    expect(form.qualifier).toBe(42)
    expect(form.valueLabel).toBeUndefined()
    expect(form.unit).toBe('')
  })

  it('defaults valueType to STRING when missing', () => {
    const attr = {
      value: { qualifier: 'test' },
    } as unknown as DynamicVariantAttribute

    const form = attributeToFormValues('key', attr)
    expect(form.valueType).toBe('STRING')
  })
})

describe('defaultQualifierForType', () => {
  it('returns false for BOOLEAN', () => {
    expect(defaultQualifierForType('BOOLEAN')).toBe(false)
  })

  it('returns 0 for NUMBER', () => {
    expect(defaultQualifierForType('NUMBER')).toBe(0)
  })

  it('returns 0 for DECIMAL', () => {
    expect(defaultQualifierForType('DECIMAL')).toBe(0)
  })

  it('returns empty string for STRING', () => {
    expect(defaultQualifierForType('STRING')).toBe('')
  })
})
