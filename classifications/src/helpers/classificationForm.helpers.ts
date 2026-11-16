import type Localized from '../models/Localized.model'
import { Category, CategoryType } from '../models/Category.model'

/** Ported from management-dashboard `modules/classifications/helpers/classificationForm.helpers`. */
export interface ClassificationFormFields {
  name: Localized
  code: string
  description: Localized
  parentId: string
  position: number
  validityFrom: string
  validityTo: string
  published: boolean
  ownClassificationMixins: {
    required: boolean
    schemaUrl: string
    name: string
  }[]
}

export const createClassificationForm = (): ClassificationFormFields => {
  return {
    name: {},
    code: '',
    description: {},
    parentId: '',
    position: 0,
    validityFrom: '',
    validityTo: '',
    published: true,
    ownClassificationMixins: [],
  }
}

export const mapClassificationToForm = (
  classification: Category
): ClassificationFormFields => {
  return {
    name: classification.localizedName || {},
    code: classification.code || '',
    description: classification.localizedDescription || {},
    parentId: classification.parentId || '',
    position: classification.position || 0,
    validityFrom: classification.validity?.from || '',
    validityTo: classification.validity?.to || '',
    published: classification.published || false,
    ownClassificationMixins: classification.ownClassificationMixins || [],
  }
}

export const mapFormToPayload = (
  form: ClassificationFormFields,
  classification?: Category
): Partial<Category> => {
  return {
    ...classification,
    localizedName: form.name,
    code: form.code,
    localizedDescription: form.description,
    parentId: form.parentId,
    position: form.position,
    validity: {
      from: form.validityFrom,
      to: form.validityTo,
    },
    published: form.published,
    ownClassificationMixins: form.ownClassificationMixins,
    type: CategoryType.CLASSIFICATION,
  }
}
