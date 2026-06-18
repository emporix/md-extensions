import { describe, expect, it } from 'vitest'
import { getSliderThumbLeftCss } from './sliderHelpers'

describe('getSliderThumbLeftCss', () => {
  it('returns min thumb position at minimum value', () => {
    expect(getSliderThumbLeftCss(0, 0, 10)).toBe('calc(0% - 0px + 8px)')
  })

  it('returns max thumb position at maximum value', () => {
    expect(getSliderThumbLeftCss(10, 0, 10)).toBe('calc(100% - 16px + 8px)')
  })

  it('returns midpoint at half value', () => {
    expect(getSliderThumbLeftCss(5, 0, 10)).toBe('calc(50% - 8px + 8px)')
  })

  it('clamps values outside range', () => {
    expect(getSliderThumbLeftCss(100, 1, 100)).toBe('calc(100% - 16px + 8px)')
    expect(getSliderThumbLeftCss(0, 1, 100)).toBe('calc(0% - 0px + 8px)')
  })

  it('handles equal min and max', () => {
    expect(getSliderThumbLeftCss(5, 5, 5)).toBe('calc(8px)')
  })

  it('falls back to half-thumb when value is NaN', () => {
    expect(getSliderThumbLeftCss(Number.NaN, 1, 100)).toBe('calc(8px)')
  })

  it('supports a custom thumb size', () => {
    expect(getSliderThumbLeftCss(10, 0, 10, 20)).toBe(
      'calc(100% - 20px + 10px)'
    )
  })
})
