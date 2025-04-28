import Localized from './Localized'
import { Metadata } from './Metadata'

export enum SchemaType {
  CATEGORY = 'CATEGORY',
  COMPANY = 'COMPANY',
  COUPON = 'COUPON',
  CUSTOM_ENTITY = 'CUSTOM_ENTITY',
  CUSTOMER = 'CUSTOMER',
  CUSTOMER_ADDRESS = 'CUSTOMER_ADDRESS',
  ORDER = 'ORDER',
  PRICE_LIST = 'PRICE_LIST',
  PRODUCT = 'PRODUCT',
  QUOTE = 'QUOTE',
  RETURN = 'RETURN',
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
}

export interface Schema {
  id: string
  name: string | Localized
  attributes: SchemaAttribute[] | undefined
  types: SchemaType[] | string[] | undefined
  metadata?: Metadata & { url: string }
}

export interface Reference {
  id: string
  name: string | Localized
  attributes?: SchemaAttribute[] | undefined
  types: SchemaType[] | undefined
  metadata?: Metadata & { url: string }
}

export interface Type {
  value: string
}
