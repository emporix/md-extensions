import Localized from './Localized.model'

export interface Region {
  code: string
  name: Localized
  metadata: {
    createdAt: string
    modifiedAt: string
    version: number
  }
}
