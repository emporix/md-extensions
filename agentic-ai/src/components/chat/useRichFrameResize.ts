import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { resizeChartFrame } from '../../utils/richContent/vegaLitePresentation'

export type RichFrameSize = {
  readonly width: number
  readonly height: number
}

export const fitFrameSvg = (node: HTMLElement): void => {
  const svg = node.querySelector('svg')
  if (!svg) {
    return
  }
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
}

export const useRichFrameResize = () => {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const onResizeRef = useRef<((size: RichFrameSize) => void) | null>(null)

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const frame = frameRef.current
    const handle = event.currentTarget
    if (!frame) {
      return
    }
    const start = {
      width: frame.getBoundingClientRect().width,
      height: frame.getBoundingClientRect().height,
    }
    const origin = { x: event.clientX, y: event.clientY }
    handle.setPointerCapture(event.pointerId)

    const move = (ev: PointerEvent) => {
      const next = resizeChartFrame(start, {
        x: ev.clientX - origin.x,
        y: ev.clientY - origin.y,
      })
      frame.style.width = `${next.width}px`
      frame.style.height = `${next.height}px`
      onResizeRef.current?.(next)
      const canvas = canvasRef.current
      if (canvas) {
        fitFrameSvg(canvas)
      }
    }
    const stop = (ev: PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) {
        handle.releasePointerCapture(ev.pointerId)
      }
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  return { frameRef, canvasRef, startResize, onResizeRef }
}
