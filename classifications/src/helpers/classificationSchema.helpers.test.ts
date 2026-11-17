import { describe, expect, test } from 'vitest'
import {
  diffSchemaAttributes,
  findSchemaByUrl,
  getSchemaIdAndVersion,
  isSchemaUrlValid,
  mapOwnSchemaToAttributes,
  mapToTableAttribute,
  parseSchemaUrl,
} from './classificationSchema.helpers'
import { Schema, SchemaAttribute } from '../models/Schema.model'
import { MixinsSchema } from '../models/Mixins.model'

describe('isSchemaUrlValid', () => {
  test('should return true for valid https URL ending with .json', () => {
    expect(isSchemaUrlValid('https://example.com/schemas/test.json')).toBe(true)
  })

  test('should return true for valid http URL ending with .json', () => {
    expect(isSchemaUrlValid('http://example.com/schemas/test.json')).toBe(true)
  })

  test('should return true for cloudinary URL', () => {
    expect(
      isSchemaUrlValid(
        'https://res.cloudinary.com/saas-ag/raw/upload/emporix-docs/toolsClassification_v1.json'
      )
    ).toBe(true)
  })

  test('should return true for localhost URL', () => {
    expect(isSchemaUrlValid('http://localhost:3000/schema.json')).toBe(true)
  })

  test('should return true for localhost without port', () => {
    expect(isSchemaUrlValid('http://localhost/schema.json')).toBe(true)
  })

  test('should return false for URL not ending with .json', () => {
    expect(isSchemaUrlValid('https://example.com/schemas/test')).toBe(false)
  })

  test('should return false for empty string', () => {
    expect(isSchemaUrlValid('')).toBe(false)
  })

  test('should return false for invalid URL', () => {
    expect(isSchemaUrlValid('not-a-url')).toBe(false)
  })

  test('should return false for URL without protocol', () => {
    expect(isSchemaUrlValid('example.com/test.json')).toBe(false)
  })

  test('should trim whitespace and validate', () => {
    expect(isSchemaUrlValid('  https://example.com/test.json  ')).toBe(true)
  })
})

describe('parseSchemaUrl', () => {
  test('should parse URL with version correctly', () => {
    const result = parseSchemaUrl(
      'https://example.com/schemas/mySchema_v2.json'
    )
    expect(result).toEqual({
      baseUrl: 'https://example.com/schemas/mySchema',
      version: 2,
    })
  })

  test('should parse URL with multi-digit version', () => {
    const result = parseSchemaUrl(
      'https://example.com/schemas/mySchema_v123.json'
    )
    expect(result).toEqual({
      baseUrl: 'https://example.com/schemas/mySchema',
      version: 123,
    })
  })

  test('should return null for URL without version pattern', () => {
    const result = parseSchemaUrl('https://example.com/schemas/mySchema.json')
    expect(result).toBeNull()
  })

  test('should return null for empty string', () => {
    const result = parseSchemaUrl('')
    expect(result).toBeNull()
  })

  test('should return null for invalid URL', () => {
    const result = parseSchemaUrl('not-a-valid-url')
    expect(result).toBeNull()
  })
})

describe('getSchemaIdAndVersion', () => {
  test('should extract id and version from emporix schema URL', () => {
    const result = getSchemaIdAndVersion(
      'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/tenant/mySchema_v3.json'
    )
    expect(result).toEqual({
      id: 'mySchema',
      version: 3,
    })
  })

  test('should return undefined for non-emporix URL', () => {
    const result = getSchemaIdAndVersion(
      'https://example.com/schemas/mySchema_v1.json'
    )
    expect(result).toEqual({
      id: undefined,
      version: undefined,
    })
  })

  test('should return undefined for empty string', () => {
    const result = getSchemaIdAndVersion('')
    expect(result).toEqual({
      id: undefined,
      version: undefined,
    })
  })
})

describe('findSchemaByUrl', () => {
  const mockSchemas: Schema[] = [
    {
      id: 'schema1',
      name: { en: 'Schema 1' },
      attributes: [],
      types: ['CLASSIFICATION'],
      metadata: {
        url: 'https://example.com/schemas/schema1_v1.json',
        version: 1,
      },
    },
    {
      id: 'schema2',
      name: { en: 'Schema 2' },
      attributes: [],
      types: ['CLASSIFICATION'],
      metadata: {
        url: 'https://example.com/schemas/schema2_v2.json',
        version: 2,
      },
    },
  ]

  test('should find matching schema and confirm version match', () => {
    const result = findSchemaByUrl(
      'https://example.com/schemas/schema1_v1.json',
      mockSchemas
    )
    expect(result.emporixSchema).toBeDefined()
    expect(result.emporixSchema?.id).toBe('schema1')
    expect(result.versionMatch).toBe(true)
  })

  test('should find matching schema with different version', () => {
    const result = findSchemaByUrl(
      'https://example.com/schemas/schema2_v1.json',
      mockSchemas
    )
    expect(result.emporixSchema).toBeDefined()
    expect(result.emporixSchema?.id).toBe('schema2')
    expect(result.versionMatch).toBe(false)
  })

  test('should return undefined schema when no match found', () => {
    const result = findSchemaByUrl(
      'https://example.com/schemas/unknown_v1.json',
      mockSchemas
    )
    expect(result.emporixSchema).toBeUndefined()
  })

  test('should handle undefined schemas array', () => {
    const result = findSchemaByUrl(
      'https://example.com/schemas/schema1_v1.json',
      undefined
    )
    expect(result.emporixSchema).toBeUndefined()
  })

  test('should handle empty schemas array', () => {
    const result = findSchemaByUrl(
      'https://example.com/schemas/schema1_v1.json',
      []
    )
    expect(result.emporixSchema).toBeUndefined()
  })
})

describe('mapOwnSchemaToAttributes', () => {
  const createMixinsSchema = (
    properties: Record<string, unknown>,
    required: string[] = []
  ) =>
    ({
      $id: 'test-id',
      $schema: 'http://json-schema.org/draft-07/schema#',
      description: 'Test schema',
      properties,
      required,
    }) as unknown as MixinsSchema

  test('should map schema properties to table attributes', () => {
    const schema = createMixinsSchema(
      {
        name: { type: 'string', description: 'Name field' },
        count: { type: 'number', description: 'Count field', readOnly: true },
      },
      ['name']
    )

    const result = mapOwnSchemaToAttributes(schema)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      name: { en: 'name' },
      required: { value: true },
      readOnly: { value: false },
      localized: { value: false },
      nullable: { value: false },
    })
    expect(result).toContainEqual({
      name: { en: 'count' },
      required: { value: false },
      readOnly: { value: true },
      localized: { value: false },
      nullable: { value: false },
    })
  })

  test('should detect nullable type', () => {
    const schema = createMixinsSchema({
      optionalField: { type: ['string', 'null'], description: 'Optional' },
      nothing: { type: 'null', description: 'Always null' },
      text: { type: 'string', description: 'Never null' },
    })

    const result = mapOwnSchemaToAttributes(schema)

    expect(result.map((attribute) => attribute.nullable.value)).toEqual([
      true,
      true,
      false,
    ])
  })

  test('should handle empty properties', () => {
    const schema = createMixinsSchema({})

    const result = mapOwnSchemaToAttributes(schema)

    expect(result).toHaveLength(0)
  })
})

describe('mapToTableAttribute', () => {
  test('should map schema attribute to table attribute', () => {
    const attr = {
      key: 'test-key',
      name: { en: 'Test Attribute' },
      metadata: {
        required: true,
        nullable: false,
        readOnly: true,
        localized: false,
      },
    } as unknown as SchemaAttribute

    const result = mapToTableAttribute(attr)

    expect(result).toEqual({
      name: { en: 'Test Attribute' },
      required: { value: true },
      nullable: { value: false },
      readOnly: { value: true },
      localized: { value: false },
    })
  })

  test('should handle missing metadata', () => {
    const attr = {
      key: 'test-key',
      name: { en: 'Test' },
    } as unknown as SchemaAttribute

    const result = mapToTableAttribute(attr)

    expect(result).toEqual({
      name: { en: 'Test' },
      required: { value: false },
      nullable: { value: false },
      readOnly: { value: false },
      localized: { value: false },
    })
  })
})

describe('diffSchemaAttributes', () => {
  const createAttribute = (
    key: string,
    name: string,
    metadata?: Partial<SchemaAttribute['metadata']>,
    nestedAttributes?: SchemaAttribute[]
  ): SchemaAttribute =>
    ({
      key,
      name: { en: name },
      metadata: {
        required: false,
        nullable: false,
        readOnly: false,
        localized: false,
        ...metadata,
      },
      attributes: nestedAttributes || [],
    }) as unknown as SchemaAttribute

  test('should mark new attributes with toAdd', () => {
    const currentAttributes = [createAttribute('attr1', 'Attribute 1')]
    const oldAttributes: SchemaAttribute[] = []

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].toAdd).toBe(true)
    expect(result[0].toDelete).toBeUndefined()
  })

  test('should mark deleted attributes with toDelete', () => {
    const currentAttributes: SchemaAttribute[] = []
    const oldAttributes = [createAttribute('attr1', 'Attribute 1')]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].toDelete).toBe(true)
    expect(result[0].toAdd).toBeUndefined()
  })

  test('should mark changed required field with toChange', () => {
    const currentAttributes = [
      createAttribute('attr1', 'Attribute 1', { required: true }),
    ]
    const oldAttributes = [
      createAttribute('attr1', 'Attribute 1', { required: false }),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].required.toChange).toBe(true)
    expect(result[0].required.value).toBe(true)
  })

  test('should mark changed nullable field with toChange', () => {
    const currentAttributes = [
      createAttribute('attr1', 'Attribute 1', { nullable: true }),
    ]
    const oldAttributes = [
      createAttribute('attr1', 'Attribute 1', { nullable: false }),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].nullable.toChange).toBe(true)
  })

  test('should mark changed readOnly field with toChange', () => {
    const currentAttributes = [
      createAttribute('attr1', 'Attribute 1', { readOnly: true }),
    ]
    const oldAttributes = [
      createAttribute('attr1', 'Attribute 1', { readOnly: false }),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].readOnly.toChange).toBe(true)
  })

  test('should mark changed localized field with toChange', () => {
    const currentAttributes = [
      createAttribute('attr1', 'Attribute 1', { localized: true }),
    ]
    const oldAttributes = [
      createAttribute('attr1', 'Attribute 1', { localized: false }),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].localized.toChange).toBe(true)
  })

  test('should not mark unchanged attributes', () => {
    const currentAttributes = [
      createAttribute('attr1', 'Attribute 1', { required: true }),
    ]
    const oldAttributes = [
      createAttribute('attr1', 'Attribute 1', { required: true }),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].toAdd).toBeUndefined()
    expect(result[0].toDelete).toBeUndefined()
    expect(result[0].required.toChange).toBeUndefined()
  })

  test('should handle nested attributes', () => {
    const currentAttributes: SchemaAttribute[] = [
      {
        key: 'parent',
        name: { en: 'Parent' },
        description: { en: '' },
        type: 'OBJECT',
        values: [],
        attributes: [createAttribute('child', 'Child')],
        arrayType: undefined,
        metadata: {
          required: false,
          nullable: false,
          readOnly: false,
          localized: false,
        },
      } as unknown as SchemaAttribute,
    ]
    const oldAttributes: SchemaAttribute[] = [
      {
        key: 'parent',
        name: { en: 'Parent' },
        description: { en: '' },
        type: 'OBJECT',
        values: [],
        attributes: [],
        arrayType: undefined,
        metadata: {
          required: false,
          nullable: false,
          readOnly: false,
          localized: false,
        },
      } as unknown as SchemaAttribute,
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(1)
    expect(result[0].attributes).toHaveLength(1)
    expect(result[0].attributes?.[0].toAdd).toBe(true)
  })

  test('should handle complex diff with added, deleted and changed attributes', () => {
    const currentAttributes = [
      createAttribute('kept', 'Kept', { required: true }),
      createAttribute('added', 'Added'),
    ]
    const oldAttributes = [
      createAttribute('kept', 'Kept', { required: false }),
      createAttribute('deleted', 'Deleted'),
    ]

    const result = diffSchemaAttributes(currentAttributes, oldAttributes)

    expect(result).toHaveLength(3)

    const kept = result.find((r) => r.name.en === 'Kept')
    expect(kept?.required.toChange).toBe(true)
    expect(kept?.toAdd).toBeUndefined()
    expect(kept?.toDelete).toBeUndefined()

    const added = result.find((r) => r.name.en === 'Added')
    expect(added?.toAdd).toBe(true)

    const deleted = result.find((r) => r.name.en === 'Deleted')
    expect(deleted?.toDelete).toBe(true)
  })

  test('should handle empty arrays', () => {
    const result = diffSchemaAttributes([], [])
    expect(result).toHaveLength(0)
  })

  test('should handle undefined arrays', () => {
    const result = diffSchemaAttributes(undefined, undefined)
    expect(result).toHaveLength(0)
  })
})
