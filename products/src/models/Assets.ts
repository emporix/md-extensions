import { Metadata } from './Order'

export enum MediaRefIdType {
  BRAND = 'BRAND',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',
  LABEL = 'LABEL',
}

export enum MediaType {
  BLOB = 'BLOB',
  LINK = 'LINK',
}

export enum MediaAccess {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface RefId {
  type: MediaRefIdType
  id: string
}

export interface Asset {
  id: string
  access: string
  type: string
  url: string
  details: {
    filename: string
    mimeType: string
    bytes: number
    etag: string
  }
  metadata: Metadata
  refIds: RefId
}
