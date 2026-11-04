import { describe, expect, it } from 'vitest'
import { createLabelForm, OverlayPositions, type Label } from './Label.model'

describe('createLabelForm', () => {
  it('returns empty fields when no label is given (add mode)', () => {
    expect(createLabelForm()).toEqual({
      name: '',
      description: '',
      overlay: { position: undefined },
    })
  })

  it('maps an existing label onto the editable fields', () => {
    const label: Label = {
      id: 'sale',
      name: 'Sale',
      description: '<p>Discounted</p>',
      image: 'https://example.test/sale.png',
      overlay: { position: OverlayPositions.TOP_RIGHT },
    }

    expect(createLabelForm(label)).toEqual({
      name: 'Sale',
      description: '<p>Discounted</p>',
      overlay: { position: OverlayPositions.TOP_RIGHT },
    })
  })

  it('keeps the NONE overlay position instead of treating 0 as empty', () => {
    const form = createLabelForm({
      id: 'sale',
      name: 'Sale',
      overlay: { position: OverlayPositions.NONE },
    })

    expect(form.overlay.position).toBe(OverlayPositions.NONE)
  })

  it('falls back to empty strings for missing fields', () => {
    expect(createLabelForm({ id: 'sale' })).toEqual({
      name: '',
      description: '',
      overlay: { position: undefined },
    })
  })

  it('omits non-editable fields so they cannot be submitted as form values', () => {
    const form = createLabelForm({
      id: 'sale',
      name: 'Sale',
      image: 'https://example.test/sale.png',
      cloudinaryUrl: 'https://cloudinary.test/sale.png',
    })

    expect(form).not.toHaveProperty('id')
    expect(form).not.toHaveProperty('image')
    expect(form).not.toHaveProperty('cloudinaryUrl')
  })
})
