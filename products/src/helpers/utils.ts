import { Entry, ExtendedOrderStatus, Language } from '../models/Configuration'
import { ConfigSchema, PrimeTableItem } from '../models/Settings'
import { Contact, ContactDetails, Customer } from '../models/LegalEntity'
import i18n from '../translations/i18n'
import { Brand } from '../models/Brand'
import { Option } from '../components/products/LabelChip'
import { trimImage } from './images'
import { Label } from '../models/Labels'

export const mapOrderStatuses = (config: any): ExtendedOrderStatus[] => {
  return Object.keys(config).map((key: any) => {
    return {
      key: key,
      id: config[key].id as string,
      displayText: config[key].displayText as string,
      possibleTransitions: config[key].availableStates && [
        ...config[key].availableStates,
      ],
    }
  })
}

export const parseNameToKey = (name: string): string =>
  name?.toLowerCase().replaceAll(' ', '_')

export const transformToConfigurationSchema = (
  key: string,
  data: Entry[]
): ConfigSchema => {
  return {
    value: JSON.stringify(data),
    key: key,
  }
}

export const mapToPrimeTable = (
  entries: Language[] | null
): PrimeTableItem[] | undefined => {
  if (!entries) return
  return entries.map((entry: Entry, index: number) => {
    return {
      id: index.toString(),
      code: entry.id,
      label: entry.label,
      default: entry.default,
      required: entry.required,
    }
  })
}

export const mapToApiData = (item: PrimeTableItem): Language => {
  return {
    id: item.code,
    label: item.label,
    default: item.default,
    required: item.required,
  }
}

export const MAX_FRACTION_DIGIT = 20

export const formatCurrency = (
  currency: string | undefined,
  value: number | undefined,
  locale = i18n.language,
  nullText = '--'
) => {
  if (value === undefined || !currency) return nullText
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    console.error(`Error formatting currency: ${error}`)
    return nullText
  }
}

export const groupBy = (arr: any[], key: string) => {
  return arr.reduce((prev, next) => {
    prev[next[key]] = prev[next[key]] || []
    prev[next[key]].push(next)
    return prev
  }, {})
}

export const deepClone = <T>(objectToClone: T): T => {
  return JSON.parse(JSON.stringify(objectToClone))
}

export const updateObjectField = (obj: any, path: string, value: any) => {
  const [key, ...rest] = path.toString().split('.')
  if (!(key in obj)) {
    obj[key] = {}
  }
  if (rest.length > 0) {
    updateObjectField(obj[key], rest.join('.'), value)
  } else {
    obj[key] = value
  }
}

export const removeEmptyValues = <T>(obj: T): Partial<T> | T => {
  const clonedObj = deepClone(obj)
  for (const key in clonedObj) {
    const value = clonedObj[key]
    if (isObject(value)) {
      removeObjectEmptyValues(value)
      isEmptyObject(value) && delete clonedObj[key]
    } else {
      isNullable(value) && delete clonedObj[key]
    }
  }
  return clonedObj
}

export const removeObjectEmptyValues = (obj: any) => {
  for (const key in obj) {
    const value = obj[key]
    if (isObject(value)) {
      removeObjectEmptyValues(value)
      isEmptyObject(value) && delete obj[key]
    } else {
      isNullable(value) && delete obj[key]
    }
  }
}

export const getObjectWithNoEmptyValues = (obj: any) => {
  const newObj = deepClone(obj)
  for (const key in newObj) {
    const value = newObj[key]
    if (isObject(value)) {
      removeObjectEmptyValues(value)
      isEmptyObject(value) && delete newObj[key]
    } else {
      isNullable(value) && delete newObj[key]
    }
  }
  return newObj
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && !Array.isArray(value) && value !== null
}

export const isEmptyObject = (value: any) => {
  return isObject(value) && Object.keys(value).length === 0
}

export const isNullable = (value: unknown) => {
  return value === '' || value === null || value === undefined
}

export const formatContactName = (contact: Contact) =>
  `${(contact && contact.name) || ''} ${(contact && contact.surname) || ''}`

export const formatCustomerName = (customer: Customer | undefined) =>
  `${(customer && customer.name) || ''} ${(customer && customer.surname) || ''}`

export const mapBrandToDropdown = (brand: Brand): Option => {
  return {
    image: brand.image ? trimImage(brand.image, 50, 30) : '',
    id: brand.id || '',
    name: brand.name || '',
  }
}

export const mapLabelToDropdown = (label: Label): Option => {
  return {
    image: label.image ? trimImage(label.image, 30, 30) : '',
    id: label.id || '',
    name: label.name || '',
  }
}

export const sleep = (time: number) =>
  new Promise((r) => {
    setTimeout(r, time)
  })

export const formatAddress = (contactDetails: ContactDetails) => {
  const getStringValue = (val: string | number) => (val ? `${val},` : '')

  return `${getStringValue(contactDetails.addressLine1)} ${getStringValue(
    contactDetails.addressLine2
  )} ${getStringValue(contactDetails.city)} ${getStringValue(
    contactDetails.postcode
  )} ${getStringValue(contactDetails.countryCode)}`.replace(/,*$/, '')
}

export const getArrayFromEnum = (enumType: any) => {
  return Object.keys(enumType)
    .filter((key) => isNaN(Number(key)))
    .map((key) => enumType[key])
}

export const compareObjects = <T extends object>(
  obj1: T,
  obj2: T
): Partial<T> => {
  const changedFields: Partial<T> = {}
  for (const [key, obj1Value] of Object.entries(obj1)) {
    const obj2Value = obj2[key as keyof T]
    if (obj2Value !== obj1Value) {
      if (typeof obj2Value === 'object' && typeof obj1Value === 'object') {
        const nestedChanges = compareObjects(obj1Value, obj2Value)
        if (Object.keys(nestedChanges).length > 0) {
          //@ts-ignore
          changedFields[key] = nestedChanges
        }
      } else {
        changedFields[key as keyof T] = obj2Value
      }
    }
  }
  return changedFields
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
    const titleCaseCamelCaseWords = camelCaseWords.map((camelWord) => {
      return (
        camelWord.charAt(0).toUpperCase() + camelWord.slice(1).toLowerCase()
      )
    })
    return titleCaseCamelCaseWords.join(' ')
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
