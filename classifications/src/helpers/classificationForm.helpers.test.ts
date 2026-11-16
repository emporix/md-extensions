import { describe, expect, test } from 'vitest'
import {
  ClassificationFormFields,
  createClassificationForm,
  mapClassificationToForm,
  mapFormToPayload,
} from './classificationForm.helpers'
import { Category, CategoryType } from '../models/Category.model'

describe('createClassificationForm', () => {
  test('should return empty form with default values', () => {
    const result = createClassificationForm()

    expect(result).toEqual({
      name: {},
      code: '',
      description: {},
      parentId: '',
      position: 0,
      validityFrom: '',
      validityTo: '',
      published: true,
      ownClassificationMixins: [],
    })
  })

  test('should return published as true by default', () => {
    const result = createClassificationForm()

    expect(result.published).toBe(true)
  })

  test('should return empty ownClassificationMixins array', () => {
    const result = createClassificationForm()

    expect(result.ownClassificationMixins).toEqual([])
    expect(Array.isArray(result.ownClassificationMixins)).toBe(true)
  })
})

describe('mapClassificationToForm', () => {
  const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
    id: 'test-id',
    localizedName: { en: 'Test Name' },
    localizedDescription: { en: 'Test Description' },
    localizedSlug: { en: 'test-slug' },
    name: 'Test Name',
    description: 'Test Description',
    code: 'TEST-CODE',
    validity: {
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    },
    position: 5,
    published: true,
    mixins: {},
    ecn: [],
    metadata: { version: 1 },
    type: CategoryType.CLASSIFICATION,
    ownClassificationMixins: [
      {
        name: 'TestMixin',
        required: true,
        schemaUrl: 'https://example.com/schema.json',
      },
    ],
    ...overrides,
  })

  test('should map all classification fields to form', () => {
    const classification = createMockCategory()

    const result = mapClassificationToForm(classification)

    expect(result).toEqual({
      name: { en: 'Test Name' },
      code: 'TEST-CODE',
      description: { en: 'Test Description' },
      parentId: '',
      position: 5,
      validityFrom: '2024-01-01T00:00:00Z',
      validityTo: '2024-12-31T23:59:59Z',
      published: true,
      ownClassificationMixins: [
        {
          name: 'TestMixin',
          required: true,
          schemaUrl: 'https://example.com/schema.json',
        },
      ],
    })
  })

  test('should map parentId when present', () => {
    const classification = createMockCategory({ parentId: 'parent-123' })

    const result = mapClassificationToForm(classification)

    expect(result.parentId).toBe('parent-123')
  })

  test('should handle missing localizedName', () => {
    const classification = createMockCategory({
      localizedName: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.name).toEqual({})
  })

  test('should handle missing localizedDescription', () => {
    const classification = createMockCategory({
      localizedDescription: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.description).toEqual({})
  })

  test('should handle missing code', () => {
    const classification = createMockCategory({
      code: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.code).toBe('')
  })

  test('should handle missing validity', () => {
    const classification = createMockCategory({
      validity: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.validityFrom).toBe('')
    expect(result.validityTo).toBe('')
  })

  test('should handle missing position', () => {
    const classification = createMockCategory({
      position: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.position).toBe(0)
  })

  test('should handle missing published', () => {
    const classification = createMockCategory({
      published: undefined,
    } as unknown as Partial<Category>)

    const result = mapClassificationToForm(classification)

    expect(result.published).toBe(false)
  })

  test('should handle missing ownClassificationMixins', () => {
    const classification = createMockCategory({
      ownClassificationMixins: undefined,
    })

    const result = mapClassificationToForm(classification)

    expect(result.ownClassificationMixins).toEqual([])
  })

  test('should handle empty ownClassificationMixins', () => {
    const classification = createMockCategory({
      ownClassificationMixins: [],
    })

    const result = mapClassificationToForm(classification)

    expect(result.ownClassificationMixins).toEqual([])
  })
})

describe('mapFormToPayload', () => {
  const createMockForm = (
    overrides: Partial<ClassificationFormFields> = {}
  ): ClassificationFormFields => ({
    name: { en: 'Form Name' },
    code: 'FORM-CODE',
    description: { en: 'Form Description' },
    parentId: 'parent-456',
    position: 10,
    validityFrom: '2024-06-01T00:00:00Z',
    validityTo: '2024-06-30T23:59:59Z',
    published: false,
    ownClassificationMixins: [
      {
        name: 'FormMixin',
        required: false,
        schemaUrl: 'https://example.com/form-schema.json',
      },
    ],
    ...overrides,
  })

  test('should map form to payload without existing classification', () => {
    const form = createMockForm()

    const result = mapFormToPayload(form)

    expect(result).toEqual({
      localizedName: { en: 'Form Name' },
      code: 'FORM-CODE',
      localizedDescription: { en: 'Form Description' },
      parentId: 'parent-456',
      position: 10,
      validity: {
        from: '2024-06-01T00:00:00Z',
        to: '2024-06-30T23:59:59Z',
      },
      published: false,
      ownClassificationMixins: [
        {
          name: 'FormMixin',
          required: false,
          schemaUrl: 'https://example.com/form-schema.json',
        },
      ],
      type: CategoryType.CLASSIFICATION,
    })
  })

  test('should merge with existing classification', () => {
    const form = createMockForm()
    const existingClassification: Partial<Category> = {
      id: 'existing-id',
      metadata: { version: 5 },
      ecn: ['ecn-1', 'ecn-2'],
    }

    const result = mapFormToPayload(form, existingClassification as Category)

    expect(result.id).toBe('existing-id')
    expect(result.metadata).toEqual({ version: 5 })
    expect(result.ecn).toEqual(['ecn-1', 'ecn-2'])
    expect(result.localizedName).toEqual({ en: 'Form Name' })
    expect(result.code).toBe('FORM-CODE')
  })

  test('should override existing classification fields with form values', () => {
    const form = createMockForm({ code: 'NEW-CODE' })
    const existingClassification: Partial<Category> = {
      id: 'existing-id',
      code: 'OLD-CODE',
      localizedName: { en: 'Old Name' },
    }

    const result = mapFormToPayload(form, existingClassification as Category)

    expect(result.code).toBe('NEW-CODE')
    expect(result.localizedName).toEqual({ en: 'Form Name' })
  })

  test('should always set type to CLASSIFICATION', () => {
    const form = createMockForm()

    const result = mapFormToPayload(form)

    expect(result.type).toBe(CategoryType.CLASSIFICATION)
  })

  test('should handle empty form fields', () => {
    const form = createMockForm({
      name: {},
      code: '',
      description: {},
      parentId: '',
      position: 0,
      validityFrom: '',
      validityTo: '',
      ownClassificationMixins: [],
    })

    const result = mapFormToPayload(form)

    expect(result.localizedName).toEqual({})
    expect(result.code).toBe('')
    expect(result.localizedDescription).toEqual({})
    expect(result.parentId).toBe('')
    expect(result.position).toBe(0)
    expect(result.validity).toEqual({ from: '', to: '' })
    expect(result.ownClassificationMixins).toEqual([])
  })

  test('should preserve validity structure', () => {
    const form = createMockForm({
      validityFrom: '2025-01-01T00:00:00Z',
      validityTo: '2025-12-31T23:59:59Z',
    })

    const result = mapFormToPayload(form)

    expect(result.validity).toEqual({
      from: '2025-01-01T00:00:00Z',
      to: '2025-12-31T23:59:59Z',
    })
  })

  test('should handle multiple ownClassificationMixins', () => {
    const form = createMockForm({
      ownClassificationMixins: [
        {
          name: 'Mixin1',
          required: true,
          schemaUrl: 'https://example.com/1.json',
        },
        {
          name: 'Mixin2',
          required: false,
          schemaUrl: 'https://example.com/2.json',
        },
        {
          name: 'Mixin3',
          required: true,
          schemaUrl: 'https://example.com/3.json',
        },
      ],
    })

    const result = mapFormToPayload(form)

    expect(result.ownClassificationMixins).toHaveLength(3)
    expect(result.ownClassificationMixins?.[0].name).toBe('Mixin1')
    expect(result.ownClassificationMixins?.[1].name).toBe('Mixin2')
    expect(result.ownClassificationMixins?.[2].name).toBe('Mixin3')
  })
})
