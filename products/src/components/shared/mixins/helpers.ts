import {
  Mixins,
  MixinsPropertyType,
  MixinsSchemaFormat,
  MixinsSchemaProperty,
} from '../../../models/Mixins'
import Localized from '../../../models/Localized'
import { Schema } from '../../../models/Schema'
import { v4 as uuidv4 } from 'uuid'

export interface MixinsFormTemplate {
  id: string
  name: string
  template: JSX.Element
}

export interface MixinsFormData {
  id: string
  name: string | Localized
  items: MixinsFormItem[] | undefined
  mixins: Mixins
  metadata: MixinsFormMetadata
}

export interface MixinsFormItem {
  name: Localized | string
  key: string
  type: MixinsFormItemType
  isRequired: boolean
  isReadonly?: boolean
  enum?: string[]
  options?: any
  items?: MixinsFormItem[]
  arrayType?: MixinsFormItemType
}

export enum MixinsFormItemType {
  text = 'text',
  decimal = 'decimal',
  integer = 'integer',
  boolean = 'boolean',
  enum = 'enum',
  date = 'date',
  dateTime = 'date-time',
  time = 'time',
  localized = 'localized',
  object = 'object',
  array = 'array',
  unknown = 'unknown',
}

export interface LocalizedMixin {
  language: string
  value: string | number | boolean
}

export interface MixinsFormMetadata {
  key: string
  url: string
}

export interface ArrayMixinField {
  id: string
  value: string | number | boolean | LocalizedMixin[]
}

export const isArrayMixinField = (obj: any): obj is ArrayMixinField => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    (typeof obj.value === 'string' ||
      typeof obj.value === 'number' ||
      typeof obj.value === 'boolean' ||
      typeof obj.value === 'object' ||
      (Array.isArray(obj.value) &&
        obj.value.every((val: any) => isLocalizedMixin(val))))
  )
}

export const isLocalizedMixin = (obj: any): obj is LocalizedMixin => {
  return (
    typeof obj == 'object' &&
    typeof obj.language === 'string' &&
    (typeof obj.value === 'string' ||
      typeof obj.value === 'number' ||
      typeof obj.value === 'boolean')
  )
}

const isSimpleType = (value: any) => {
  return (
    ['string', 'number', 'boolean'].includes(typeof value) || value === null
  )
}

export const convertToIdValuePair = (obj: any): any => {
  const newObj: any = {}
  for (const field in obj) {
    const prop = obj[field]
    if (Array.isArray(prop) && prop.length > 0) {
      const mappedProp = prop
        .filter((value) => !isArrayMixinField(value))
        .map((value) => {
          if (isSimpleType(value) || Array.isArray(value)) {
            return { id: uuidv4(), value }
          } else if (typeof value === 'object') {
            return { id: uuidv4(), value: convertToIdValuePair(value) }
          }
          return value
        })
      newObj[field] = mappedProp
    } else if (Array.isArray(prop) && prop.length === 0) {
      newObj[field] = []
    } else if (typeof prop === 'object' && prop !== null) {
      newObj[field] = convertToIdValuePair(prop)
    } else {
      newObj[field] = prop
    }
  }
  return newObj
}

export const convertFromIdValuePair = (data: any): any => {
  const newData: any = {}

  for (const field in data) {
    const prop = data[field]

    if (Array.isArray(prop)) {
      newData[field] = prop.map((item) => {
        if (
          isArrayMixinField(item) &&
          !Array.isArray(item.value) &&
          typeof item.value !== 'object'
        ) {
          return item.value
        } else if (
          isArrayMixinField(item) &&
          Array.isArray(item.value) &&
          item.value.length > 0
        ) {
          return item.value
        } else if (isArrayMixinField(item)) {
          return convertFromIdValuePair(item.value)
        } else if (typeof item === 'object' && item !== null) {
          return convertFromIdValuePair(item)
        }
        return item
      })
    } else if (typeof prop === 'object' && prop !== null) {
      if (isArrayMixinField(prop)) {
        newData[field] = convertFromIdValuePair(prop.value)
      } else {
        newData[field] = convertFromIdValuePair(prop)
      }
    } else {
      newData[field] = prop
    }
  }

  for (const field in newData) {
    if (
      typeof newData[field] === 'object' &&
      Object.keys(newData[field]).length === 0
    ) {
      newData[field] = []
    }
  }

  return newData
}

export const mapMixinsPropertyToItemType = (
  property: MixinsSchemaProperty
): MixinsFormItemType => {
  if (Array.isArray(property.type) && property.type.length > 0) {
    property.type = property.type[0]
  }
  switch (true) {
    case property.pattern !== undefined:
      return MixinsFormItemType.unknown
    case property.enum && property.enum.length > 0:
      return MixinsFormItemType.enum
    case property.type === MixinsPropertyType.boolean:
      return MixinsFormItemType.boolean
    case property.type === MixinsPropertyType.integer:
      return MixinsFormItemType.integer
    case property.type === 'number' && property.multipleOf === undefined:
      return MixinsFormItemType.integer
    case property.type === 'number' && property.multipleOf === 0.01:
      return MixinsFormItemType.decimal
    case property.options?.editor === 'date' ||
      property.format === MixinsSchemaFormat.date:
      return MixinsFormItemType.date
    case property.format === MixinsSchemaFormat.dateTime:
      return MixinsFormItemType.dateTime
    case property.format === MixinsSchemaFormat.time:
      return MixinsFormItemType.time
    case property.type === MixinsPropertyType.array &&
      (property.items?.$ref?.endsWith('schemata2/languageValue_v1.json') ||
        property.items?.$ref?.endsWith(
          'schemata2/languageValueNullable_v1.json'
        )):
      return MixinsFormItemType.localized
    case property.type === MixinsPropertyType.string &&
      !property.format &&
      !property.enum:
      return MixinsFormItemType.text
    case property.type === MixinsPropertyType.object ||
      property.$ref !== undefined:
      return MixinsFormItemType.object
    case property.type === MixinsPropertyType.array:
      return MixinsFormItemType.array
    default:
      return MixinsFormItemType.unknown
  }
}

export const mapMixinsPropertyToItemArrayType = (
  property: MixinsSchemaProperty
): MixinsFormItemType | undefined => {
  if (Array.isArray(property.type) && property.type.length > 0) {
    property.type = property.type[0]
  }
  if (property.type !== 'array') {
    return undefined
  }

  const items = property.items

  if (items === undefined) {
    return undefined
  }

  switch (true) {
    case items.pattern !== undefined:
      return MixinsFormItemType.unknown
    case items.enum && items.enum.length > 0:
      return MixinsFormItemType.enum
    case items.type === MixinsPropertyType.boolean:
      return MixinsFormItemType.boolean
    case items.type === MixinsPropertyType.integer:
      return MixinsFormItemType.integer
    case items.type === 'number' && items.multipleOf === undefined:
      return MixinsFormItemType.integer
    case items.type === 'number' && items.multipleOf === 0.01:
      return MixinsFormItemType.decimal
    case items.options?.editor === 'date' ||
      items.format === MixinsSchemaFormat.date:
      return MixinsFormItemType.date
    case items.format === MixinsSchemaFormat.dateTime:
      return MixinsFormItemType.dateTime
    case items.format === MixinsSchemaFormat.time:
      return MixinsFormItemType.time
    case items.type === MixinsPropertyType.array &&
      (items.items?.$ref?.endsWith('schemata2/languageValue_v1.json') ||
        property.items?.$ref?.endsWith(
          'schemata2/languageValueNullable_v1.json'
        )):
      return MixinsFormItemType.localized
    case items.type === MixinsPropertyType.string &&
      !items.format &&
      !items.enum:
      return MixinsFormItemType.text
    case items.type === MixinsPropertyType.object:
      return MixinsFormItemType.object
    case items.type === MixinsPropertyType.array:
      return MixinsFormItemType.array
    default:
      return MixinsFormItemType.unknown
  }
}

export const defaultValueFromType = (type: MixinsFormItemType) => {
  switch (type) {
    case MixinsFormItemType.text:
      return ''
    case MixinsFormItemType.integer:
      return 0
    case MixinsFormItemType.decimal:
      return 0.0
    case MixinsFormItemType.boolean:
      return false
    case MixinsFormItemType.enum:
      return ''
    case MixinsFormItemType.date:
      return ''
    case MixinsFormItemType.dateTime:
      return ''
    case MixinsFormItemType.time:
      return ''
    case MixinsFormItemType.localized:
      return undefined
    case MixinsFormItemType.array:
      return []
    case MixinsFormItemType.object:
      return {}
    default:
      return ''
  }
}

export const createForm = (items: MixinsFormItem[]) => {
  let defaultValues: Record<string, any> = {}
  for (const item of items) {
    const keys = item.key.split('.')
    let i = 0
    while (i < keys.length - 1) {
      const key = keys[i]
      defaultValues[key] = defaultValues[key] || {}
      defaultValues = defaultValues[key]
      i++
    }
    defaultValues[keys[i]] = defaultValueFromType(item.type)
  }
  return defaultValues
}

export const mapMixinsUrlsToSchema = (
  urls: Record<string, string>
): Schema[] => {
  if (!urls) return []
  const schemas: Schema[] = []
  Object.keys(urls).forEach((key) => {
    const url = urls[key]
    const schema = {
      id: key,
      name: key,
      attributes: undefined,
      types: undefined,
      metadata: {
        url,
      },
    }
    schemas.push(schema)
  })
  return schemas
}

export const mapLocalizedToLocalizedMixins = (
  input: Localized
): LocalizedMixin[] => {
  if (!input) return []
  return Object.keys(input).map((key) => ({
    language: key,
    value: input[key],
  }))
}

export const mapLocalizedMixinToLocalized = (
  input: LocalizedMixin[]
): Localized => {
  const newInput = []
  if (Array.isArray(input)) {
    for (const el of input) {
      newInput.push(isArrayMixinField(el) ? el.value : el)
    }
  }

  if (newInput === undefined || newInput.reduce === undefined) {
    return {} as Localized
  }

  //@ts-ignore
  return newInput?.reduce((result: Localized, item: LocalizedMixin) => {
    result[item.language] = item.value as string
    return result
  }, {}) as unknown as Localized
}

const getIdAndVersion = (
  regex: RegExp,
  url: string
): Record<string, number> | undefined => {
  const match = url.match(regex)
  if (match) {
    const id = match[1]
    const version = parseInt(match[2], 10)
    return {
      [id]: version,
    }
  } else {
    return undefined
  }
}

export const getSchemaUrlRegex = (): RegExp => {
  return /https:\/\/res\.cloudinary\.com\/saas-ag\/raw\/upload\/schemata2\/\w+\/(\w+)_v(\d+)\.json/
}

export const getReferenceUrlRegex = (): RegExp => {
  return /https:\/\/res\.cloudinary\.com\/saas-ag\/raw\/upload\/schemata2\/\w+\/references\/(\w+)_v(\d+)\.json/
}

export const isSchemaUrl = (url: string): boolean => {
  return getSchemaIdAndVersion(url) !== undefined
}

export const isReferenceUrl = (url: string): boolean => {
  return getReferenceIdAndVersion(url) !== undefined
}

export const getSchemaIdAndVersion = (
  url: string
): Record<string, number> | undefined => {
  return getIdAndVersion(getSchemaUrlRegex(), url)
}

export const getReferenceIdAndVersion = (
  url: string
): Record<string, number> | undefined => {
  return getIdAndVersion(getReferenceUrlRegex(), url)
}

export const isAttributeOfObjectType = (attribute: MixinsFormItem): boolean => {
  return attribute.type === 'object'
}

export const isAttributeOfArrayObjectType = (
  attribute: MixinsFormItem
): boolean => {
  return attribute.type === 'array' && attribute.arrayType === 'object'
}

export const isAttributeOfArraySimpleType = (
  attribute: MixinsFormItem
): boolean => {
  return attribute.type === 'array' && attribute.arrayType !== 'object'
}

export const sortTree = (
  attributes: MixinsFormItem[] | undefined
): MixinsFormItem[] | undefined => {
  if (attributes === undefined) {
    return undefined
  }

  if (!attributes.sort) {
    return attributes
  }

  const sortedAttributes = attributes?.sort((a, b) => {
    if (isAttributeOfArrayObjectType(a) && !isAttributeOfArrayObjectType(b)) {
      return 1
    }
    if (isAttributeOfArrayObjectType(b) && !isAttributeOfArrayObjectType(a)) {
      return -1
    }
    if (isAttributeOfObjectType(a) && !isAttributeOfObjectType(b)) {
      return 1
    }
    if (isAttributeOfObjectType(b) && !isAttributeOfObjectType(a)) {
      return -1
    }
    if (isAttributeOfArraySimpleType(a) && !isAttributeOfArraySimpleType(b)) {
      return 1
    }
    if (isAttributeOfArraySimpleType(b) && !isAttributeOfArraySimpleType(a)) {
      return -1
    }

    return a.key > b.key ? 1 : -1
  })

  for (const attribute of sortedAttributes) {
    if (attribute.items !== undefined && attribute.items.length > 0) {
      attribute.items = sortTree(attribute.items)
    }
  }

  return sortedAttributes
}
