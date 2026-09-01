import { describe, expect, it } from 'vitest'
import { createBrandForm, type Brand } from './Brand.model'

describe('createBrandForm', () => {
  it('returns empty fields when no brand is given (add mode)', () => {
    expect(createBrandForm()).toEqual({ name: '', description: '' })
  })

  it('maps an existing brand onto the editable fields', () => {
    const brand: Brand = {
      id: 'acme',
      name: 'Acme',
      description: '<p>Outdoor equipment</p>',
      image: 'https://example.test/acme.png',
    }

    expect(createBrandForm(brand)).toEqual({
      name: 'Acme',
      description: '<p>Outdoor equipment</p>',
    })
  })

  it('falls back to empty strings for missing fields', () => {
    expect(createBrandForm({ id: 'acme' })).toEqual({
      name: '',
      description: '',
    })
  })

  it('omits non-editable fields so they cannot be submitted as form values', () => {
    const form = createBrandForm({
      id: 'acme',
      name: 'Acme',
      image: 'https://example.test/acme.png',
      cloudinaryUrl: 'https://cloudinary.test/acme.png',
    })

    expect(form).not.toHaveProperty('id')
    expect(form).not.toHaveProperty('image')
    expect(form).not.toHaveProperty('cloudinaryUrl')
  })
})
