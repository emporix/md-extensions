import { Metadata, Mixins } from './Order'
import Localized from './Localized'
import { Supplier } from './Suppliers'

export enum ProductType {
  basic = 'BASIC',
  bundle = 'BUNDLE',
  variant = 'VARIANT',
  parentVariant = 'PARENT_VARIANT',
}

export interface ProductMetadata extends Metadata {
  overridden?: string[]
}

export interface Product {
  id: string | null
  yrn: string
  code: string
  published: boolean
  description?: Localized
  mixins: Mixins
  metadata: ProductMetadata
  name: Localized
  media: Media[]
  parentVariantId?: string
  productType: ProductType
  quantity?: number
  taxClasses?: ProductTaxClasses
  relatedItems?: RelatedItem[]
  variantAttributes?: any
  bundledProducts?: BundledProduct[]
  suppliers?: Supplier[]
  brandId?: string
  labelIds?: string[]
  weightDependent?: boolean
  template: {
    id: string
    version: number
  }
}

export interface RelatedItem {
  refId: string
  type: RelatedId
}

export interface BundledProduct {
  productId: string
  amount: number
}

export interface RelatedType {
  id: RelatedId
  name?: Localized
}

export type RelatedId =
  | 'CONSUMABLE'
  | 'ACCESSORY'
  | 'YOU-MIGHT-LIKE-THIS'
  | 'SUGGESTED-RELATED-ITEMS'
  | 'SIMILAR-ITEMS'

export interface ProductTaxClasses {
  [key: string]: string
}

export interface Media {
  url: string
  id: string
}

export interface Category {
  id: string
  parentId?: string
  localizedName: Localized
  localizedDescription: Localized
  localizedSlug: Localized
  name: string
  description: string
  code: string
  validity: {
    from: string
    to: string
  }
  position: number
  published: boolean
  index?: boolean
  navigation?: boolean
  mixins: Mixins
  ecn: string[]
  metadata: Metadata
  children?: Category[]
  leaf?: boolean
}

export interface CategoryNode {
  key: string
  data: Category
  label: string
  children?: CategoryNode[]
  leaf: boolean
}

export interface CategoryProduct {
  categoryId: string
  id: string
  ref: {
    id: string
    type: 'PRODUCT' | 'SKU'
    url: string
    localizedName: Localized
  }
  modifiedAt: Date
}

export enum ProductTemplateType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATETIME = 'DATETIME',
}

export interface AttributeValue {
  key: string
}

export interface Attribute {
  key: string
  originalKey: string
  name?: Localized
  type: ProductTemplateType
  metadata: {
    mandatory?: boolean
    variantAttribute: boolean
    defaultValue?: any
  }
  values: AttributeValue[]
}

export interface ProductTemplate {
  id?: string
  name: Localized
  filterName?: string
  attributes?: Attribute[]
  metadata?: {
    version: number
  }
}
