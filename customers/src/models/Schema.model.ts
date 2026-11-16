import Localized from './Localized.model'
import { Metadata } from './Metadata.model'

export enum SchemaType {
  AVAILABILITY = 'AVAILABILITY',
  CART = 'CART',
  CART_ITEM = 'CART_ITEM',
  CATEGORY = 'CATEGORY',
  CLASSIFICATION = 'CLASSIFICATION',
  COMPANY = 'COMPANY',
  COUPON = 'COUPON',
  CUSTOM_ENTITY = 'CUSTOM_ENTITY',
  CUSTOMER = 'CUSTOMER',
  CUSTOMER_ADDRESS = 'CUSTOMER_ADDRESS',
  LOCATION = 'LOCATION',
  ORDER = 'ORDER',
  ORDER_ENTRY = 'ORDER_ENTRY',
  PRICE_LIST = 'PRICE_LIST',
  PRODUCT = 'PRODUCT',
  QUOTE = 'QUOTE',
  RETURN = 'RETURN',
  VENDOR = 'VENDOR',
  VENDOR_LOCATION = 'VENDOR_LOCATION',
  SITE = 'SITE',
}

export enum SchemaAttributeType {
  ARRAY = 'ARRAY',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATE_TIME = 'DATE_TIME',
  DECIMAL = 'DECIMAL',
  ENUM = 'ENUM',
  NUMBER = 'NUMBER',
  OBJECT = 'OBJECT',
  TEXT = 'TEXT',
  TIME = 'TIME',
  REFERENCE = 'REFERENCE',
}

export enum UpdateTypesMode {
  REPLACE = 'REPLACE',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export interface SchemaAttributeMetadata {
  readOnly: boolean
  localized: boolean
  required: boolean
  nullable: boolean
}

export interface SchemaAttributeValue {
  value: string
}

export interface SchemaArrayType {
  type: SchemaAttributeType
  values: SchemaAttributeValue[]
  localized: boolean
  attributes: SchemaAttribute[]
  precision?: number
}

export interface SchemaAttribute {
  key: string
  name: Localized
  description: Localized
  type: SchemaAttributeType
  metadata: SchemaAttributeMetadata
  values: SchemaAttributeValue[]
  attributes: SchemaAttribute[]
  arrayType: SchemaArrayType
  precision?: number
}

export interface Schema {
  id: string
  name: string | Localized
  attributes: SchemaAttribute[] | undefined
  types: SchemaType[] | string[] | undefined
  /** When true, entities may store per-site overlays under mixinStorageKey(id, siteCode). */
  siteAware?: boolean
  metadata?: Metadata & { url: string }
}

export interface Reference {
  id: string
  name: string | Localized
  attributes?: SchemaAttribute[] | undefined
  types: SchemaType[] | undefined
  siteAware?: boolean
  metadata?: Metadata & { url: string }
}

export interface Type {
  value: string
}
