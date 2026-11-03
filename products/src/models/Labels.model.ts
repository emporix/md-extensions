export enum OverlayPositions {
  NONE,
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

interface LabelMetaData {
  createdAt: string
  modifiedAt: string
  version: number
  mixins: object
}

export interface Label {
  id: string
  cloudinaryUrl?: string
  description?: string
  image?: string
  name: string
  metadata?: LabelMetaData
  overlay?: { position: OverlayPositions }
}
