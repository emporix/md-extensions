import Localized from '../../models/Localized.model'
import {
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'
import { deepClone } from '../../helpers/utils'

export type LocalizedMixinVersion = 'v1' | 'v2'

export interface LocalizedFormItem {
  key: string
  type: string
  arrayType?: string
  items?: LocalizedFormItem[]
  localizedVersion?: LocalizedMixinVersion
}

export const isLocalizedLanguageValueRef = (ref?: string): boolean => {
  if (!ref) return false
  return (
    ref.endsWith('/languageValue_v1.json') ||
    ref.endsWith('/languageValueNullable_v1.json') ||
    ref.endsWith('/languageValue_v2.json') ||
    ref.endsWith('/languageValueNullable_v2.json')
  )
}

export const isLocalizedNullableRef = (ref?: string): boolean => {
  if (!ref) return false
  return (
    ref.endsWith('/languageValueNullable_v1.json') ||
    ref.endsWith('/languageValueNullable_v2.json')
  )
}

const refVersion = (ref?: string): LocalizedMixinVersion | undefined => {
  if (!ref) return undefined
  if (
    ref.endsWith('/languageValueNullable_v2.json') ||
    ref.endsWith('/languageValue_v2.json')
  ) {
    return 'v2'
  }
  if (
    ref.endsWith('/languageValueNullable_v1.json') ||
    ref.endsWith('/languageValue_v1.json')
  ) {
    return 'v1'
  }
  return undefined
}

const propertyHasType = (
  property: MixinsSchemaProperty,
  type: MixinsPropertyType
): boolean => {
  if (Array.isArray(property.type)) {
    return property.type.includes(type)
  }
  return property.type === type
}

export const getLocalizedSchemaVersion = (
  property: MixinsSchemaProperty
): LocalizedMixinVersion | undefined => {
  if (refVersion(property.$ref) === 'v2') {
    return 'v2'
  }
  if (propertyHasType(property, MixinsPropertyType.array)) {
    const itemsVersion = refVersion(property.items?.$ref)
    if (itemsVersion === 'v1') {
      return 'v1'
    }
  }
  return undefined
}

export const getLocalizedArrayItemVersion = (
  property: MixinsSchemaProperty
): LocalizedMixinVersion | undefined => {
  const items = property.items
  if (!items) return undefined
  const itemsRef = refVersion(items.$ref)
  if (itemsRef === 'v2') {
    return 'v2'
  }
  if (propertyHasType(items, MixinsPropertyType.array)) {
    return refVersion(items.items?.$ref)
  }
  return undefined
}

const unwrapLocalizedEntry = (el: unknown): unknown => {
  if (
    el &&
    typeof el === 'object' &&
    typeof (el as { id?: unknown }).id === 'string' &&
    (el as { value?: unknown }).value != null &&
    typeof (el as { value?: unknown }).value === 'object'
  ) {
    return (el as { value: unknown }).value
  }
  return el
}

export const toLocalizedMap = (value: unknown): Localized => {
  if (value == null) return {}
  if (Array.isArray(value)) {
    return value.reduce<Localized>((result, item) => {
      const entry = unwrapLocalizedEntry(item) as {
        language?: unknown
        value?: unknown
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.language === 'string'
      ) {
        result[entry.language] = String(entry.value ?? '')
      }
      return result
    }, {})
  }
  if (typeof value === 'object') {
    const out: Localized = {}
    for (const [key, entryValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (
        typeof entryValue === 'string' ||
        typeof entryValue === 'number' ||
        typeof entryValue === 'boolean'
      ) {
        out[key] = String(entryValue)
      }
    }
    return out
  }
  return {}
}

export const fromLocalizedMap = (
  map: Localized | undefined,
  version: LocalizedMixinVersion
): Localized | { language: string; value: string }[] => {
  if (version === 'v2') {
    return map ? { ...map } : {}
  }
  if (!map) return []
  return Object.keys(map).map((key) => ({
    language: key,
    value: map[key],
  }))
}

export const serializeLocalizedFields = (
  data: unknown,
  items: LocalizedFormItem[] | undefined
): unknown => {
  if (data == null || typeof data !== 'object' || !items?.length) {
    return data
  }
  const result = deepClone(data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD: untyped mixin payload node
  const applyItem = (node: any, item: LocalizedFormItem) => {
    if (node == null || typeof node !== 'object') return
    const leaf = item.key.split('.').pop() ?? item.key
    const version = item.localizedVersion ?? 'v1'
    if (item.type === 'localized') {
      if (!Object.prototype.hasOwnProperty.call(node, leaf)) return
      const current = node[leaf]
      if (current == null || typeof current !== 'object') return
      node[leaf] = fromLocalizedMap(toLocalizedMap(current), version)
      return
    }
    if (item.type === 'array' && item.arrayType === 'localized') {
      if (!Object.prototype.hasOwnProperty.call(node, leaf)) return
      if (!Array.isArray(node[leaf])) return
      node[leaf] = node[leaf].map((el: unknown) =>
        el == null ? el : fromLocalizedMap(toLocalizedMap(el), version)
      )
      return
    }
    if (
      item.type === 'array' &&
      item.arrayType === 'object' &&
      Array.isArray(node[leaf]) &&
      item.items?.length
    ) {
      node[leaf].forEach((el: unknown) => {
        if (el && typeof el === 'object') {
          item.items?.forEach((child) => applyItem(el, child))
        }
      })
      return
    }
    if (
      item.type === 'object' &&
      item.items?.length &&
      node[leaf] &&
      typeof node[leaf] === 'object'
    ) {
      item.items.forEach((child) => applyItem(node[leaf], child))
    }
  }
  items.forEach((item) => applyItem(result, item))
  return result
}
