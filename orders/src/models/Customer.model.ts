import { Metadata } from './Metadata.model'

/**
 * Lean subset of the Management Dashboard `Customer` model — only the fields
 * the order screens read.
 */
export interface Customer {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  type?: string
  metadata?: Metadata
}
