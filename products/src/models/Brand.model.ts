export interface Brand {
  id?: string
  cloudinaryUrl?: string
  description?: string
  image?: string
  name?: string
  metadata?: {
    createdAt: string
    modifiedAt: string
    version: number
  }
}

export interface BrandForm {
  id?: string
  name?: string
  description?: string
  image?: File
}
