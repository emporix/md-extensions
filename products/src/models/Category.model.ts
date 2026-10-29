import Localized from './Localized.model'
import { Metadata } from './Metadata.model'
import { ClassificationMixin, Mixins } from './Mixins.model'

export enum ProductType {
  basic = 'BASIC',
  bundle = 'BUNDLE',
  variant = 'VARIANT',
  parentVariant = 'PARENT_VARIANT',
  dynamicVariant = 'DYNAMIC_VARIANT',
}

export type DynamicVariantValueType =
  | 'STRING'
  | 'NUMBER'
  | 'DECIMAL'
  | 'BOOLEAN'

export interface DynamicVariantAttributeValue {
  type: DynamicVariantValueType
  qualifier: string | number | boolean
  name?: Localized
  unit?: string
}

export interface DynamicVariantAttribute {
  name?: Localized
  value: DynamicVariantAttributeValue
}

export type OwnVariantAttributes = Record<string, DynamicVariantAttribute>
export type InheritedVariantAttributes = Record<string, DynamicVariantAttribute>

export interface DynamicVariantInfo {
  missingAncestorId?: string
  cycleDetected?: boolean
}

export interface VariantMapEntry {
  version?: number
  code?: string
  name?: Localized
  parentVariantId?: string
  sellable?: boolean
  published?: boolean
  dynamicVariantType?: string
  variantAttributes?: OwnVariantAttributes
}

export enum CategoryType {
  STANDARD = 'STANDARD',
  CLASSIFICATION = 'CLASSIFICATION',
}

export interface ProductMetadata extends Metadata {
  /** Schema key → schema URL (MD `Metadata` was `[key: string]: any`). */
  mixins?: Record<string, string>
  overridden?: string[]
  classificationMixins?: ClassificationMixin[]
  dynamicVariantInfo?: DynamicVariantInfo
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
  parentVariantPath?: string[]
  productType: ProductType
  quantity?: number
  taxClasses?: ProductTaxClasses
  relatedItems?: RelatedItem[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD model
  variantAttributes?: any
  ownVariantAttributes?: OwnVariantAttributes
  inheritedVariantAttributes?: InheritedVariantAttributes
  variants?: Record<string, VariantMapEntry>
  sellable?: boolean
  dynamicVariantType?: string
  bundledProducts?: BundledProduct[]
  brandId?: string
  labelIds?: string[]
  weightDependent?: boolean
  template?: {
    id: string
    version: number
  }
  vendor: ProductVendor
}

export interface ProductVendor {
  id: string
  name: string
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
  type: CategoryType
  classificationMixins?: ClassificationMixin[]
  ownClassificationMixins?: ClassificationMixin[]
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

export interface CategoryTree {
  id: string
  parentId?: string
  code?: string
  localizedName: Localized
  localizedDescription?: Localized
  localizedSlug?: Localized
  validity?: {
    from?: string
    to?: string
  }
  position: number
  published: boolean
  ecn?: string[]
  subcategories?: CategoryTree[]
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD model
    defaultValue?: any
  }
  values: AttributeValue[]
}

export interface ProductTemplate {
  id?: string
  name: Localized
  filterName?: string
  attributes?: Attribute[]
  metadata?: Metadata
}
