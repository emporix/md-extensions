import { describe, expect, it } from 'vitest'
import { flatten, parseMixinColumns } from './schema.helper'
import {
  SchemaAttributeType,
  type Schema,
  type SchemaAttribute,
} from '../models/Schema.model'

const leaf = (
  key: string,
  type: SchemaAttributeType = SchemaAttributeType.TEXT
): SchemaAttribute =>
  ({
    key,
    name: { en: key },
    type,
  }) as SchemaAttribute

describe('flatten', () => {
  it('maps a leaf attribute to a dotted mixin column', () => {
    expect(flatten('return', leaf('reason'))).toEqual({
      key: 'return.reason',
      label: { en: 'reason' },
      type: SchemaAttributeType.TEXT,
    })
  })

  it('flattens nested object attributes', () => {
    const address = {
      key: 'address',
      name: { en: 'Address' },
      type: SchemaAttributeType.OBJECT,
      attributes: [leaf('city'), leaf('zip', SchemaAttributeType.NUMBER)],
    } as SchemaAttribute

    expect(flatten('return', address)).toEqual([
      {
        key: 'return.address.city',
        label: { en: 'city' },
        type: SchemaAttributeType.TEXT,
      },
      {
        key: 'return.address.zip',
        label: { en: 'zip' },
        type: SchemaAttributeType.NUMBER,
      },
    ])
  })

  it('flattens arrayType attributes', () => {
    const items = {
      key: 'items',
      name: { en: 'Items' },
      type: SchemaAttributeType.ARRAY,
      arrayType: {
        type: SchemaAttributeType.OBJECT,
        values: [],
        localized: false,
        attributes: [leaf('sku')],
      },
    } as SchemaAttribute

    expect(flatten('return', items)).toEqual([
      {
        key: 'return.items.sku',
        label: { en: 'sku' },
        type: SchemaAttributeType.TEXT,
      },
    ])
  })
})

describe('parseMixinColumns', () => {
  it('flattens attributes from every schema', () => {
    const schemas = [
      {
        id: 'return',
        attributes: [
          leaf('reason'),
          leaf('approved', SchemaAttributeType.BOOLEAN),
        ],
      },
      {
        id: 'order',
        attributes: [leaf('number')],
      },
    ] as Schema[]

    expect(parseMixinColumns(schemas)).toEqual([
      {
        key: 'return.reason',
        label: { en: 'reason' },
        type: SchemaAttributeType.TEXT,
      },
      {
        key: 'return.approved',
        label: { en: 'approved' },
        type: SchemaAttributeType.BOOLEAN,
      },
      {
        key: 'order.number',
        label: { en: 'number' },
        type: SchemaAttributeType.TEXT,
      },
    ])
  })

  it('skips schemas with missing attributes', () => {
    expect(
      parseMixinColumns([
        { id: 'empty' } as Schema,
        { id: 'return', attributes: [] },
      ])
    ).toEqual([])
  })
})
