import {
  Mixins,
  MixinsPropertyType,
  MixinsSchemaFormat,
  MixinsSchemaProperty,
} from 'models/Mixins'
import Localized from '../../models/Localized'
import { Schema } from 'models/Schema'
import { v4 as uuidv4 } from 'uuid'
import { ReactNode } from 'react'
import {
  compareObjects,
  deepClone,
  deepFieldsRemove,
  deepMerge,
  isEmptyObject,
  isObject,
} from 'helpers/utils'

export interface MixinsFormTemplate {
  id: string
  template: ReactNode
  name?: string
  newerVersion?: number
}

export interface MixinsFormData {
  id: string
  name: string | Localized
  items: MixinsFormItem[] | undefined
  mixins: Mixins
  metadata: MixinsFormMetadata
  newerMetadata?: MixinsFormMetadata
  sourceCategoryName?: Localized
}

export interface MixinsFormItem {
  name: Localized | string
  key: string
  type: MixinsFormItemType
  isRequired: boolean
  isReadonly?: boolean
  enum?: (string | null)[]
  options?: any
  items?: MixinsFormItem[]
  arrayType?: MixinsFormItemType
  toDelete?: boolean
  toAdd?: boolean
  toChange?: boolean
  referenceType?: string
  referenceTypeEnum?: (string | null)[]
  isNullable?: boolean
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
  reference = 'reference',
  unknown = 'unknown',
}

export interface LocalizedMixin {
  language: string
  value: string | number | boolean
}

export interface MixinsFormMetadata {
  key: string
  url: string
  version: number
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
      newObj[field] = prop
        .filter((value) => !isArrayMixinField(value))
        .map((value) => {
          if (isSimpleType(value) || Array.isArray(value)) {
            return { id: uuidv4(), value }
          } else if (typeof value === 'object') {
            return { id: uuidv4(), value: convertToIdValuePair(value) }
          }
          return value
        })
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
  return newData
}

export const mapMixinsPropertyToItemType = (
  property: MixinsSchemaProperty
): MixinsFormItemType => {
  const baseType =
    Array.isArray(property.type) && property.type.length > 0
      ? property.type[0]
      : property.type
  switch (true) {
    case baseType === MixinsPropertyType.object &&
      property.properties?.emporixReferenceType != null:
      return MixinsFormItemType.reference
    case property.pattern != null:
      return MixinsFormItemType.unknown
    case property.enum && property.enum.length > 0:
      return MixinsFormItemType.enum
    case baseType === MixinsPropertyType.boolean:
      return MixinsFormItemType.boolean
    case baseType === MixinsPropertyType.integer:
      return MixinsFormItemType.integer
    case baseType === 'number' && property.multipleOf === undefined:
      return MixinsFormItemType.integer
    case baseType === 'number' && property.multipleOf === 0.01:
      return MixinsFormItemType.decimal
    case property.options?.editor === 'date' ||
      property.format === MixinsSchemaFormat.date:
      return MixinsFormItemType.date
    case property.format === MixinsSchemaFormat.dateTime:
      return MixinsFormItemType.dateTime
    case property.format === MixinsSchemaFormat.time:
      return MixinsFormItemType.time
    case baseType === MixinsPropertyType.array &&
      (property.items?.$ref?.endsWith('schemata2/languageValue_v1.json') ||
        property.items?.$ref?.endsWith(
          'schemata2/languageValueNullable_v1.json'
        )):
      return MixinsFormItemType.localized
    case baseType === MixinsPropertyType.string &&
      !property.format &&
      !property.enum:
      return MixinsFormItemType.text
    case baseType === MixinsPropertyType.object || property.$ref !== undefined:
      return MixinsFormItemType.object
    case baseType === MixinsPropertyType.array:
      return MixinsFormItemType.array
    default:
      return MixinsFormItemType.unknown
  }
}

export const mapMixinsPropertyToItemArrayType = (
  property: MixinsSchemaProperty
): MixinsFormItemType | undefined => {
  const baseType =
    Array.isArray(property.type) && property.type.length > 0
      ? property.type[0]
      : property.type

  if (baseType !== 'array') {
    return undefined
  }
  const items = property.items
  if (items === undefined) {
    return undefined
  }
  switch (true) {
    case items.type === MixinsPropertyType.object &&
      items.properties?.emporixReferenceType != null:
      return MixinsFormItemType.reference
    case items.pattern != null:
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

export const defaultValueForMixinItem = (
  item: MixinsFormItem,
  isArrayElement = false,
  referenceType?: string
) => {
  if (item.isNullable) return null
  const type = isArrayElement && item.arrayType ? item.arrayType : item.type
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
      return item.enum && item.enum.length > 0 ? item.enum[0] : ''
    case MixinsFormItemType.date:
      return new Date().toISOString()
    case MixinsFormItemType.dateTime:
      return new Date().toISOString()
    case MixinsFormItemType.time:
      return ''
    case MixinsFormItemType.localized:
      return []
    case MixinsFormItemType.array:
      return []
    case MixinsFormItemType.object:
      return {}
    case MixinsFormItemType.reference:
      return { emporixReferenceType: referenceType || '', id: '' }
    default:
      return ''
  }
}

export const setAtPath = (obj: any, path: string, value: any) => {
  const keys = path.split('.')
  let cursor = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (cursor[k] === undefined || cursor[k] === null) cursor[k] = {}
    cursor = cursor[k]
  }
  cursor[keys[keys.length - 1]] = value
}

export const hasValue = (val: any) => {
  if (Array.isArray(val)) return true
  if (val === 0) return true
  return val !== undefined && val !== null && val !== ''
}

export const getChangedIds = (items: MixinsFormItem[]): Set<string> => {
  const out = new Set<string>()
  const stack = [...items]
  while (stack.length) {
    const it = stack.pop()
    if (it?.toChange) out.add(it.key)
    if (it?.items?.length) stack.push(...it.items)
  }
  return out
}

export const getToDeleteIds = (items: MixinsFormItem[]): Set<string> => {
  const out = new Set<string>()
  const stack = [...items]
  while (stack.length) {
    const it = stack.pop()
    if (it?.toDelete) out.add(it.key)
    if (it?.items?.length) stack.push(...it.items)
  }
  return out
}

export const filterOutChangedMixins = (
  data: any,
  items: MixinsFormItem[]
): any => {
  const toChangeIds = getChangedIds(items)
  return deepFieldsRemove(data, toChangeIds, { removeEmpty: true })
}

export const filterOutDeletedMixins = (
  data: any,
  items: MixinsFormItem[]
): any => {
  const toDeleteIds = getToDeleteIds(items)
  return deepFieldsRemove(data, toDeleteIds, { removeEmpty: false })
}

export const applyDefaultsOnEmptyFields = (
  data: any,
  items: MixinsFormItem[]
): any => {
  const result = deepMerge({}, data)
  const walkData = (node: any, basePath = '', insideArray = false) => {
    if (Array.isArray(node)) {
      node.forEach((el, idx) => {
        const elPath = `${basePath}[${idx}]`
        if (el !== null && typeof el === 'object') {
          walkData(el, elPath, true)
        } else if (!hasValue(el)) {
          const item = findItemForPath(basePath, items)
          if (item) {
            node[idx] = item.isNullable
              ? null
              : defaultValueForMixinItem(item, true, undefined)
          }
        }
      })
      return
    }
    if (node !== null && typeof node === 'object') {
      const keys = Object.keys(node)
      for (const key of keys) {
        const path = basePath ? `${basePath}.${key}` : key
        const value = node[key]
        const item = findItemForPath(path, items)
        if (item) {
          if (!hasValue(value)) {
            setAtPath(
              result,
              path,
              item.isNullable
                ? null
                : defaultValueForMixinItem(item, insideArray, undefined)
            )
          } else if (Array.isArray(value)) {
            walkData(value, path, false)
          } else if (value !== null && typeof value === 'object') {
            walkData(value, path, insideArray)
          }
        } else {
          if (
            Array.isArray(value) ||
            (value !== null && typeof value === 'object')
          ) {
            walkData(value, path, insideArray)
          }
        }
      }
      return
    }
    if (!hasValue(node) && basePath) {
      const item = findItemForPath(basePath, items)
      if (item) {
        setAtPath(
          result,
          basePath,
          item.isNullable
            ? null
            : defaultValueForMixinItem(item, insideArray, undefined)
        )
      }
    }
  }
  walkData(result, '', false)
  return result
}

export const findItemForPath = (
  fullPath: string,
  items: MixinsFormItem[] = []
): MixinsFormItem | undefined => {
  const keys = fullPath.split('.')
  let children: MixinsFormItem[] | undefined = items
  let current: MixinsFormItem | undefined
  for (const k of keys) {
    if (!children) return undefined
    current = children.find((c) => c.key.split('.').pop() === k)
    children = current?.items
    if (!current) return undefined
  }
  return current
}

export const createForm = (items: MixinsFormItem[]) => {
  const defaultValues: Record<string, any> = {}
  for (const item of items) {
    let current = defaultValues
    const keys = item.key.split('.')
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      current[k] = current[k] || {}
      current = current[k]
    }
    const lastKey = keys[keys.length - 1]
    const referenceType =
      item.referenceTypeEnum?.length === 1
        ? (item.referenceTypeEnum[0] as string)
        : undefined
    current[lastKey] = defaultValueForMixinItem(item, false, referenceType)
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

  if (newInput?.reduce === undefined) {
    return {} as Localized
  }

  //@ts-ignore
  return newInput?.reduce((result: Localized, item: LocalizedMixin) => {
    result[item.language] = item.value as string
    return result
  }, {}) as unknown as Localized
}

const getIdAndVersion = (regex: RegExp, url: string) => {
  const match = url.match(regex)
  const id = match ? match[1] : undefined
  const version = match ? parseInt(match[2], 10) : undefined
  return { id, version }
}

export const emporixSchemaUrlRegex = (): RegExp => {
  return /https:\/\/res\.cloudinary\.com\/saas-ag\/raw\/upload\/schemata2\/\w+\/(\w+)_v(\d+)\.json/
}

export const emporixReferenceUrlRegex = (): RegExp => {
  return /https:\/\/res\.cloudinary\.com\/saas-ag\/raw\/upload\/schemata2\/\w+\/references\/(\w+)_v(\d+)\.json/
}

export const isEmporixSchemaUrl = (url: string): boolean => {
  return getSchemaIdAndVersion(url).id !== undefined
}

export const isEmporixReferenceUrl = (url: string): boolean => {
  return getReferenceIdAndVersion(url).id !== undefined
}

export const getSchemaIdAndVersion = (url: string) => {
  return getIdAndVersion(emporixSchemaUrlRegex(), url)
}

export const getReferenceIdAndVersion = (url: string) => {
  return getIdAndVersion(emporixReferenceUrlRegex(), url)
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

export const isAttributeOfArraySingleReference = (
  attribute: MixinsFormItem
): boolean => {
  return attribute.type === 'array' && attribute.arrayType === 'reference'
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

const itemEqual = (a: MixinsFormItem, b: MixinsFormItem): boolean => {
  const sanitizeItem = (it: MixinsFormItem) => {
    const newItem = deepClone(it)
    delete newItem.toAdd
    delete newItem.toDelete
    delete newItem.items
    delete newItem.enum
    return {
      ...newItem,
      ...(Array.isArray(it.enum) ? { enum: [...it.enum].sort() } : {}),
    }
  }
  const sanitizedA = sanitizeItem(a)
  const sanitizedB = sanitizeItem(b)
  const changed = compareObjects(sanitizedA, sanitizedB)
  return isEmptyObject(changed)
}

export const markAddDeep = (it: MixinsFormItem): MixinsFormItem => ({
  ...it,
  toDelete: undefined,
  toAdd: true,
  items: it.items?.map(markAddDeep),
})

export const markDeleteDeep = (it: MixinsFormItem): MixinsFormItem => ({
  ...it,
  toDelete: true,
  toAdd: undefined,
  items: it.items?.map(markDeleteDeep),
})

export const diffAddRemove = (
  presentItems: MixinsFormItem[] = [],
  newerItems: MixinsFormItem[] = []
): MixinsFormItem[] => {
  const pMap = new Map(presentItems.map((i) => [i.key, i]))
  const nMap = new Map(newerItems.map((i) => [i.key, i]))
  const result: MixinsFormItem[] = []

  // Iterate through present items and check for deletions and changes
  for (const p of presentItems) {
    const n = nMap.get(p.key)
    if (!n) {
      // if is not in the newer, mark as deleted
      result.push(markDeleteDeep(p))
      continue
    }
    // Recursive diff for children
    const children = diffAddRemove(p.items ?? [], n.items ?? [])
    // Check if the field is changed
    const isChanged = !itemEqual(p, n)
    result.push({
      ...n,
      toAdd: undefined,
      toDelete: undefined,
      toChange: isChanged || undefined,
      items: children.length ? children : undefined,
    })
  }

  // Add new items from newerItems to result
  for (const n of newerItems) {
    if (!pMap.has(n.key)) {
      result.push(markAddDeep(n))
    }
  }

  return result
}

export interface SchemaDiffResult {
  toAdd: Set<string>
  toDelete: Set<string>
  toChange: Record<string, { from: any; to: any }>
}

export const diffJsons = (
  presentJson: JSON,
  newerJson: JSON
): SchemaDiffResult => {
  const toAdd = new Set<string>()
  const toDelete = new Set<string>()
  const toChange: Record<string, { from: any; to: any }> = {}
  const isArray = Array.isArray
  const same = (a: any, b: any) => {
    if (a === b) return true
    return Number.isNaN(a) && Number.isNaN(b)
  }
  const joinPath = (base: string, key: string | number) =>
    base === ''
      ? String(key)
      : typeof key === 'number'
      ? `${base}[${key}]`
      : `${base}.${key}`

  const walk = (a: any, b: any, path = '') => {
    // Primitives
    if (!isObject(a) && !isArray(a) && !isObject(b) && !isArray(b)) {
      if (!same(a, b)) {
        toChange[path] = { from: a, to: b }
      }
      return
    }
    // If types differ - the whole branch changed
    const typeA = isArray(a) ? 'array' : isObject(a) ? 'object' : typeof a
    const typeB = isArray(b) ? 'array' : isObject(b) ? 'object' : typeof b
    if (typeA !== typeB) {
      toChange[path] = { from: a, to: b }
      return
    }
    // Arrays
    if (isArray(a) && isArray(b)) {
      const maxLen = Math.max(a.length, b.length)
      for (let i = 0; i < maxLen; i++) {
        const ap = a[i]
        const bp = b[i]
        const p = joinPath(path, i)
        if (i >= a.length) {
          toAdd.add(p)
        } else if (i >= b.length) {
          toDelete.add(p)
        } else {
          walk(ap, bp, p)
        }
      }
      return
    }
    // Objects
    if (isObject(a) && isObject(b)) {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      const setA = new Set(keysA)
      const setB = new Set(keysB)
      // Deleted keys
      for (const k of keysA) {
        if (!setB.has(k)) {
          toDelete.add(joinPath(path, k))
        }
      }
      // Added keys
      for (const k of keysB) {
        if (!setA.has(k)) {
          toAdd.add(joinPath(path, k))
        }
      }
      // Common keys
      for (const k of keysA) {
        if (setB.has(k)) {
          walk(a[k], b[k], joinPath(path, k))
        }
      }
      return
    }
    // Fallback for other types
    if (!same(a, b)) {
      toChange[path] = { from: a, to: b }
    }
  }
  walk(presentJson, newerJson, '')
  return { toAdd, toDelete, toChange }
}
