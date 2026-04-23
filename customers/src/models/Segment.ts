import { Metadata } from './Metadata'
import Localized from './Localized'
import { Mixins } from './Mixins'

export interface Segment {
  id: string
  name: Localized
  description: Localized
  status: SegmentStatus
  validity: SegmentValidity
  siteCode: string
  metadata: Metadata
}

export enum SegmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface SegmentValidity {
  from: string
  to: string
}

export interface SegmentMember {
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  legalEntity: {
    id: string
    name: string
  }
  assignedType: SegmentMemberType
  metadata: Metadata
}

export enum SegmentMemberType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export interface SegmentItem {
  item: {
    id: string
    code: string
    name: Localized
  }
  type: SegmentItemType
  metadata: Metadata
  mixins?: Mixins
}

export enum SegmentItemType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
}
