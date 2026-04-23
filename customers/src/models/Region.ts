import Localized from './Localized'

export interface Region {
  code: string
  name: Localized
  metadata: {
    createdAt: string
    modifiedAt: string
    version: number
  }
}
