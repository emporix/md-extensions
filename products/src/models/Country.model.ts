import { Metadata } from './Metadata.model'
import Localized from './Localized.model'

export interface Country {
  code: string
  name: Localized
  regions: string[]
  active: boolean
  metadata: Metadata
}
