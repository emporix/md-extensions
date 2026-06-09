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
  if (max <= min) {
    return `calc(${thumbSizePx / 2}px)`
  }

  const clamped = Math.min(max, Math.max(min, value))
  const ratio = (clamped - min) / (max - min)
  const thumbOffset = ratio * thumbSizePx
  const halfThumb = thumbSizePx / 2

  return `calc(${ratio * 100}% - ${thumbOffset}px + ${halfThumb}px)`
}
