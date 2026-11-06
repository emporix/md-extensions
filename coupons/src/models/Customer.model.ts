import { Metadata } from './Metadata.model'

/**
 * Lean subset of the Management Dashboard `Customer` model — only the fields
 * the order and coupon screens read.
 */
export interface Customer {
  id: string
  customerNumber?: string
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  type?: string
  metadata?: Metadata
}
