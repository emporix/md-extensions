export interface Brand {
  id?: string
  cloudinaryUrl?: string
  description?: string
  image?: string
  name?: string
  // Mirrors @emporix/api-calls' Brand metadata shape (fields are required
  // there), so brands can be passed straight into its call signatures.
  metadata?: {
    createdAt: string
    modifiedAt: string
    version: number
  }
}

/** Fields editable on the Brand details form. */
export interface BrandFormFields {
  name: string
  description: string
}

export const createBrandForm = (brand?: Brand): BrandFormFields => ({
  name: brand?.name ?? '',
  description: brand?.description ?? '',
})
