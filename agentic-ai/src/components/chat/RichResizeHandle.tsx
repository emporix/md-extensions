import type { PointerEvent } from 'react'

type RichResizeHandleProps = {
  readonly label: string
  readonly onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
}

export const RichResizeHandle = ({
  label,
  onPointerDown,
}: RichResizeHandleProps) => (
  <button
    type="button"
    className="rich-frame-resize"
    aria-label={label}
    onPointerDown={onPointerDown}
  />
)
