import { MixinsPropertyType, MixinsSchema } from '../models/Mixins.model'
import { Schema, SchemaAttribute } from '../models/Schema.model'
import type Localized from '../models/Localized.model'

/** Ported from management-dashboard `modules/classifications/helpers/classificationSchema.helpers`. */
export interface TableAttribute {
  name: Localized
  required: TableAttributeData
  nullable: TableAttributeData
  readOnly: TableAttributeData
  localized: TableAttributeData
  attributes?: TableAttribute[]
  toDelete?: boolean
  toAdd?: boolean
  toChange?: boolean
}

export interface TableAttributeData {
  value: boolean
  toChange?: boolean
}

export interface SchemaUrlParts {
  baseUrl: string
  version: number | undefined
}

export const isSchemaUrlValid = (value: string): boolean => {
  if (!value) return false
  // Host part: localhost(:port)? or domain
  const host = '(localhost(?::\\d+)?|([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})'
  // Path must end with .json, and optional query/hash
  const path = '(\\/[^\\s?#]*\\.json)'
  const pattern = new RegExp('^https?:\\/\\/' + host + path + '$', 'i')
  return pattern.test(value.trim())
}

/**
 * A JSON-schema property is nullable when its `type` is, or lists, `"null"`.
 * MD compared the entries with the value `null`, which no schema contains.
 */
const isNullableType = (type: MixinsSchema['properties'][string]['type']) =>
  Array.isArray(type)
    ? type.includes(MixinsPropertyType.null)
    : type === MixinsPropertyType.null

export const mapOwnSchemaToAttributes = (schema: MixinsSchema) => {
  return Object.entries(schema.properties).map(([key, value]) => {
    return {
      name: { en: key },
      required: { value: schema.required?.includes(key) ?? false },
      readOnly: { value: !!value.readOnly },
      localized: { value: false },
      nullable: { value: isNullableType(value.type) },
    }
  })
}

export const emporixSchemaUrlRegex =
  /https:\/\/res\.cloudinary\.com\/saas-ag\/raw\/upload\/schemata2\/\w+\/(\w+)_v(\d+)\.json/

export const parseSchemaUrl = (url: string): SchemaUrlParts | null => {
  if (!url) return null
  // Pattern: [base_url]_v[version].json
  const match = url.match(/^(.+)_v(\d+)\.json$/)
  if (!match) return null
  return {
    baseUrl: match[1],
    version: parseInt(match[2], 10),
  }
}

export const getSchemaIdAndVersion = (url: string) => {
  const match = url.match(emporixSchemaUrlRegex)
  const id = match ? match[1] : undefined
  const version = match ? parseInt(match[2], 10) : undefined
  return { id, version }
}

export const findSchemaByUrl = (url: string, schemas?: Schema[]) => {
  const currentParts = parseSchemaUrl(url)
  const emporixSchema = schemas?.find((s) => {
    const schemaUrl = s.metadata?.url
    const schemaParts = parseSchemaUrl(schemaUrl || '')
    return currentParts?.baseUrl === schemaParts?.baseUrl
  })
  const versionMatch =
    currentParts?.version === emporixSchema?.metadata?.version
  return { emporixSchema, versionMatch }
}

export const mapToTableAttribute = (attr: SchemaAttribute): TableAttribute => {
  return {
    name: attr.name,
    required: { value: attr.metadata?.required ?? false },
    nullable: { value: attr.metadata?.nullable ?? false },
    readOnly: { value: attr.metadata?.readOnly ?? false },
    localized: { value: attr.metadata?.localized ?? false },
  }
}

export const diffSchemaAttributes = (
  currentAttributes: SchemaAttribute[] = [],
  oldAttributes: SchemaAttribute[] = []
): TableAttribute[] => {
  const result: TableAttribute[] = []
  const oldMap = new Map(oldAttributes.map((a) => [a.key, a]))
  const currentMap = new Map(currentAttributes.map((a) => [a.key, a]))

  // Iterate through current attributes - check if they are new or modified
  for (const current of currentAttributes) {
    const old = oldMap.get(current.key)
    const diffAttr = mapDiffedToTableAttribute(current, old)
    if (current.attributes) {
      diffAttr.attributes = diffSchemaAttributes(
        current.attributes,
        old?.attributes || []
      )
    }
    result.push(diffAttr)
  }

  // Iterate through old attributes - check if they are deleted
  for (const old of oldAttributes) {
    if (!currentMap.has(old.key)) {
      const diffAttr = mapDiffedToTableAttribute(undefined, old)
      diffAttr.toDelete = true
      diffAttr.toAdd = undefined
      if (old.attributes) {
        diffAttr.attributes = diffSchemaAttributes([], old.attributes)
      }
      result.push(diffAttr)
    }
  }
  return result
}

const mapDiffedToTableAttribute = (
  attr?: SchemaAttribute,
  oldAttr?: SchemaAttribute
): TableAttribute => {
  const isNew = !oldAttr
  const isDeleted = !attr && !!oldAttr
  const baseAttr = isDeleted ? oldAttr : attr
  const hasTypeChanged = attr?.type !== oldAttr?.type

  const createAttributeData = (
    field: keyof SchemaAttribute['metadata']
  ): TableAttributeData => {
    const hasAttrChanged =
      attr?.metadata?.[field] !== oldAttr?.metadata?.[field]
    return {
      value: baseAttr?.metadata?.[field] ?? false,
      toChange: (!isNew && !isDeleted && hasAttrChanged) || undefined,
    }
  }

  return {
    name: attr?.name || oldAttr?.name || {},
    required: createAttributeData('required'),
    nullable: createAttributeData('nullable'),
    readOnly: createAttributeData('readOnly'),
    localized: createAttributeData('localized'),
    toAdd: isNew || undefined,
    toDelete: isDeleted || undefined,
    toChange: !isNew && !isDeleted && hasTypeChanged,
  }
}
