import type { Brand } from '../models/Brand.model'
import type { Label } from '../models/Labels.model'
import type { Option } from '../components/products/LabelChip'
import { trimCloudinaryImage } from './images'

export const MAX_FRACTION_DIGIT = 20

export const deepClone = <T>(objectToClone: T): T => {
  return JSON.parse(JSON.stringify(objectToClone)) as T
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const isEmptyObject = (value: unknown) => {
  return isObject(value) && Object.keys(value).length === 0
}

export const isNullable = (value: unknown) => {
  return value === '' || value === null || value === undefined
}

export const removeObjectEmptyValues = (obj: Record<string, unknown>) => {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (isObject(value)) {
      removeObjectEmptyValues(value)
      if (isEmptyObject(value)) {
        delete obj[key]
      }
    } else if (isNullable(value)) {
      delete obj[key]
    }
  }
}

export const removeEmptyValues = <T>(obj: T): Partial<T> => {
  const clonedObj = deepClone(obj) as Record<string, unknown>
  for (const key of Object.keys(clonedObj)) {
    const value = clonedObj[key]
    if (isObject(value)) {
      removeObjectEmptyValues(value)
      if (isEmptyObject(value)) {
        delete clonedObj[key]
      }
    } else if (isNullable(value)) {
      delete clonedObj[key]
    }
  }
  return clonedObj as Partial<T>
}

export const getArrayFromEnum = <T extends Record<string, string | number>>(
  enumType: T
) => {
  return Object.keys(enumType)
    .filter((key) => Number.isNaN(Number(key)))
    .map((key) => enumType[key as keyof T])
}

export const textToTitleCase = (input: string | undefined) => {
  if (typeof input !== 'string' || input.length === 0) {
    return ''
  }
  const textWithSpaces = input.replace(
    /[^a-zA-Z0-9\u00C0-\u1FFF\u2C00-\uD7FF\p{L}\p{M}()]/gu,
    ' '
  )
  if (textWithSpaces === ' ') {
    return input
  }
  const words = textWithSpaces.split(/\s+/)
  const filteredWords = words.filter((word) => word.length > 0)
  const titleCaseWords = filteredWords.map((word) => {
    const camelCaseWords = word.split(
      /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])|(?<=[0-9])(?=[a-zA-Z])|(?<=[a-zA-Z])(?=[0-9])/
    )
    // Join camelCase parts with spaces (MD parity) so bookedInPOS → "Booked In Pos".
    return camelCaseWords
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  })
  return titleCaseWords.join(' ')
}

export const sortById = (obj1: { id: string }, obj2: { id: string }) => {
  if (obj1.id > obj2.id) {
    return 1
  }
  if (obj1.id < obj2.id) {
    return -1
  }
  return 0
}

/** Sets a dot-path field on `obj` (mutates; used by the MD `useForm` port). */
export const updateObjectField = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
) => {
  const [key, ...rest] = path.toString().split('.')
  if (!(key in obj)) {
    obj[key] = {}
  }
  if (rest.length > 0) {
    updateObjectField(
      obj[key] as Record<string, unknown>,
      rest.join('.'),
      value
    )
  } else {
    obj[key] = value
  }
}

export const mapBrandToDropdown = (brand: Brand): Option => ({
  image: brand.image ? (trimCloudinaryImage(brand.image, 50, 30) ?? '') : '',
  id: brand.id ?? '',
  name: brand.name ?? '',
})

export const mapLabelToDropdown = (label: Label): Option => ({
  image: label.image ? (trimCloudinaryImage(label.image, 30, 30) ?? '') : '',
  id: label.id ?? '',
  name: label.name ?? '',
})
