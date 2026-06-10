export const RANGE_SLIDER_THUMB_SIZE_PX = 16

/**
 * CSS `left` for a value label centered above a range input thumb.
 * Use together with `transform: translateX(-50%)` on the label.
 */
export const getSliderThumbLeftCss = (
  value: number,
  min: number,
  max: number,
  thumbSizePx = RANGE_SLIDER_THUMB_SIZE_PX
): string => {
  const halfThumbPx = thumbSizePx / 2

  if (max <= min || Number.isNaN(value)) {
    return `calc(${halfThumbPx}px)`
  }

  const clamped = Math.min(max, Math.max(min, value))
  const ratio = (clamped - min) / (max - min)
  const thumbOffset = ratio * thumbSizePx

  return `calc(${ratio * 100}% - ${thumbOffset}px + ${halfThumbPx}px)`
}
