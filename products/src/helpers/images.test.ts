import { describe, expect, it } from 'vitest'
import { trimCloudinaryImage } from './images'

describe('trimCloudinaryImage', () => {
  it('adds the transformation to cloudinary urls', () => {
    expect(
      trimCloudinaryImage('https://res.cloudinary.com/x/upload/a.png', 32, 32)
    ).toBe(
      'https://res.cloudinary.com/x/upload/c_pad,q_auto,f_auto,dpr_1,h_32,w_32/a.png'
    )
  })

  it('passes other urls through and handles empty input', () => {
    expect(trimCloudinaryImage('https://cdn/a.png', 32, 32)).toBe(
      'https://cdn/a.png'
    )
    expect(trimCloudinaryImage(undefined, 32, 32)).toBeUndefined()
  })
})
