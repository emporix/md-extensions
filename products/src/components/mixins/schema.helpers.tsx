import {
  Schema,
  SchemaArrayType,
  SchemaAttribute,
  SchemaAttributeType,
  Type,
} from '../../models/Schema.model'
import { v4 as uuidv4 } from 'uuid'
import Localized from '../../models/Localized.model'

export const DECIMAL_DEFAULT_PRECISION = 0.01
export const DECIMAL_NO_PRECISION = -1

export const getSchemaAttributeTypeLabel = (
  type: SchemaAttributeType | string | undefined
): string => {
  if (type === SchemaAttributeType.NUMBER || type === 'NUMBER') {
    return 'INTEGER'
  }
  return type ?? ''
}

export const toSchemaAttributeTypeOptions = (
  types: SchemaAttributeType[]
): { label: string; value: SchemaAttributeType }[] => {
  return types.map((type) => ({
    label: getSchemaAttributeTypeLabel(type),
    value: type,
  }))
}
export interface SchemaForm {
  types: string[]
  name: Localized | null
  key: string | null
  siteAware: boolean
  file: File | null
}

export const isSchemaSiteAware = (
  schema: Pick<Schema, 'siteAware'> | undefined | null
): boolean => schema?.siteAware === true

export interface IdName {
  id: string
  name: Localized
}

export interface SchemaAttributeForm {
  uuid: string
  key: string
  name: Localized | undefined | null
  description: Localized | undefined | null
  type: SchemaAttributeType
  values: string[] | undefined
  localized: boolean
  readOnly: boolean
  required: boolean
  nullable: boolean
  attributes: SchemaAttributeForm[] | undefined
  arrayType: SchemaAttributeType | undefined
  arrayTypeLocalized: boolean | undefined
  arrayValues: string[] | undefined
  arrayAttributes: SchemaAttributeForm[] | undefined
  precision?: number
  arrayPrecision?: number
}

export const resolveDecimalPrecision = (
  type: SchemaAttributeType | undefined,
  precision: number | undefined | null
): number | undefined => {
  if (type !== SchemaAttributeType.DECIMAL) {
    return undefined
  }
  if (precision === undefined || precision === null) {
    return DECIMAL_DEFAULT_PRECISION
  }
  return precision
}

export const createForm = () => {
  return {
    types: [] as string[],
    name: null,
    key: null,
    siteAware: false,
    file: null,
  }
}

export const createAttributeForm = (): SchemaAttributeForm => {
  return {
    uuid: uuidv4(),
    key: uuidv4(),
    name: undefined,
    description: undefined,
    type: SchemaAttributeType.TEXT,
    values: undefined,
    localized: false,
    readOnly: false,
    required: false,
    nullable: false,
    attributes: undefined,
    arrayType: undefined,
    arrayTypeLocalized: undefined,
    arrayValues: undefined,
    arrayAttributes: undefined,
    precision: undefined,
    arrayPrecision: undefined,
  } as SchemaAttributeForm
}

export const mapToForms = (
  schema: Schema,
  formDecorator: (form: SchemaAttributeForm) => SchemaAttributeForm
): SchemaAttributeForm[] | undefined => {
  return internalMapToForms(schema.attributes, formDecorator)
}

const internalMapToForms = (
  attributes: SchemaAttribute[] | undefined,
  formDecorator: (form: SchemaAttributeForm) => SchemaAttributeForm
): SchemaAttributeForm[] | undefined => {
  if (attributes === undefined || attributes.length === 0) {
    return undefined
  }
  return attributes
    ?.map((attribute) => {
      return {
        uuid: uuidv4(),
        key: attribute.key,
        type: attribute.type,
        name: attribute.name,
        description: attribute.description,
        localized: attribute.metadata.localized,
        readOnly: attribute.metadata.readOnly,
        required: attribute.metadata.required,
        nullable: attribute.metadata.nullable,
        values: attribute?.values?.map((val) => val.value),
        attributes: internalMapToForms(attribute.attributes, formDecorator),
        arrayType: attribute?.arrayType?.type,
        arrayTypeLocalized: attribute?.arrayType?.localized,
        arrayValues: attribute?.arrayType?.values?.map((val) => val.value),
        arrayAttributes: internalMapToForms(
          attribute?.arrayType?.attributes,
          formDecorator
        ),
        precision: resolveDecimalPrecision(attribute.type, attribute.precision),
        arrayPrecision: resolveDecimalPrecision(
          attribute?.arrayType?.type,
          attribute?.arrayType?.precision
        ),
      }
    })
    ?.map(formDecorator) as SchemaAttributeForm[]
}

export const mapToModel = (
  schema: Schema,
  fields: SchemaAttributeForm[],
  types: string[]
): Schema => {
  const attrs: SchemaAttribute[] | undefined = mapAttributesToModel(fields)
  schema.attributes = attrs
  schema.types = types
  schema.siteAware = schema.siteAware === true ? true : undefined
  schema.metadata = undefined
  return schema
}

const supportsValues = (type: SchemaAttributeType | undefined): boolean => {
  return (
    type === SchemaAttributeType.REFERENCE || type === SchemaAttributeType.ENUM
  )
}

const mapAttributesToModel = (
  attributes: SchemaAttributeForm[] | undefined
): SchemaAttribute[] | undefined => {
  if (attributes === undefined || attributes.length === 0) {
    return undefined
  }

  const handleArrayType = (
    attr: SchemaAttributeForm
  ): SchemaArrayType | undefined => {
    if (attr.arrayType === undefined) {
      return undefined
    }
    const mappedArrayType: SchemaArrayType = {
      type: attr.arrayType,
      values: supportsValues(attr.arrayType)
        ? attr?.arrayValues?.map((val) => {
            return { value: val }
          })
        : undefined,
      localized: attr.arrayTypeLocalized,
      attributes: mapAttributesToModel(attr.arrayAttributes),
    } as SchemaArrayType
    const arrayPrecision = resolveDecimalPrecision(
      attr.arrayType,
      attr.arrayPrecision
    )
    if (arrayPrecision !== undefined) {
      mappedArrayType.precision = arrayPrecision
    }
    return mappedArrayType
  }

  return attributes.map((attribute) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD: assembled API payload
    const mapped: any = {
      key: attribute.key,
      name: attribute.name,
      description: attribute.description ?? undefined,
      type: attribute.type,
      arrayType: handleArrayType(attribute),
      attributes: mapAttributesToModel(attribute.attributes),
      metadata: {
        localized: attribute.localized,
        readOnly: attribute.readOnly,
        required: attribute.required,
        nullable: attribute.nullable,
      },
    }
    if (supportsValues(attribute.type)) {
      mapped.values = attribute?.values?.map((val: string) => {
        return { value: val }
      })
    }
    const precision = resolveDecimalPrecision(
      attribute.type,
      attribute.precision
    )
    if (precision !== undefined) {
      mapped.precision = precision
    }
    return mapped
  }) as SchemaAttribute[]
}

const typeFallback = (idName: IdName) => {
  if (idName.id === 'CUSTOMER.ADDRESS') {
    idName.id = 'CUSTOMER_ADDRESS'
  }
  return idName
}

export const getParsedTypeId = (type: Type, mergedTypes: IdName[]) => {
  if (!mergedTypes) return ''
  const matchedType = mergedTypes.filter(
    (mergedType) => typeFallback(mergedType).id == type.value
  )[0]
  return parseId(matchedType?.id) ?? ''
}

export const parseId = (id: string) => {
  return id?.replace(/_/g, ' ')
}

export const mapToTypeWithName = (
  schemaTypes: string[],
  existingTypes: IdName[]
): IdName[] => {
  return existingTypes.filter((existingType) =>
    schemaTypes.includes(existingType.id)
  )
}
