export enum OverlayPositions {
  NONE,
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

// Mirrors @emporix/api-calls' Label metadata shape (fields are required
// there), so labels can be passed straight into its call signatures.
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

/** Fields editable on the Label details form. */
export interface LabelFormFields {
  name: string
  description: string
  overlay: { position?: OverlayPositions }
}

export const createLabelForm = (label?: Partial<Label>): LabelFormFields => ({
  name: label?.name ?? '',
  description: label?.description ?? '',
  overlay: { position: label?.overlay?.position },
})
