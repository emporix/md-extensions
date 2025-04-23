import Localized from './Localized'
import { Metadata } from './Metadata.ts'

export interface Country {
  code: string
  name: Localized
  regions: string[]
  active: boolean
  metadata: Metadata
}
