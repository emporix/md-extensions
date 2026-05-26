import { LocalizedString } from './Agent'

export interface CustomSchemaType {
  id: string
  name: LocalizedString
  metadata?: {
    createdAt?: string
    modifiedAt?: string
    version?: number
  }
  schemas?: unknown
}

export interface EntityTypeOption {
  label: string
  value: string
}
