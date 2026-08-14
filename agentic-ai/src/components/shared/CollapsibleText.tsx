import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

type UseCollapsibleTextResult = {
  readonly isExpanded: boolean
  readonly toggle: () => void
  readonly showToggle: boolean
  readonly textRef: React.RefObject<HTMLElement>
  readonly collapsedStyle: CSSProperties | undefined
}

const getLineHeightPx = (element: HTMLElement): number => {
  const computed = getComputedStyle(element)
  const lineHeight = parseFloat(computed.lineHeight)

  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight
  }

  const fontSize = parseFloat(computed.fontSize)
  if (Number.isFinite(fontSize) && fontSize > 0) {
    return fontSize * 1.4
  }

  return 20
}

const buildCollapsedStyle = (
  maxLines: number,
  maxHeightPx?: number
): CSSProperties => ({
  overflow: 'hidden',
  maxHeight:
    maxHeightPx !== undefined
      ? `${maxHeightPx}px`
      : `calc(${maxLines} * 1.4em)`,
})

export const useCollapsibleText = (
  content: string,
  maxLines: number,
  forceExpanded = false
): UseCollapsibleTextResult => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [maxHeightPx, setMaxHeightPx] = useState<number | undefined>()
  const textRef = React.useRef<HTMLElement>(null)

  useEffect(() => {
    setIsExpanded(false)
    setShowToggle(false)
    setMaxHeightPx(undefined)
  }, [content, maxLines])

  useEffect(() => {
    setIsExpanded(forceExpanded)
  }, [forceExpanded])

  const updateMeasurements = useCallback(() => {
    const element = textRef.current
    if (!element) {
      return
    }

    const lineHeight = getLineHeightPx(element)
    const clampHeight = lineHeight * maxLines
    setMaxHeightPx(clampHeight)

    const previousMaxHeight = element.style.maxHeight
    const previousOverflow = element.style.overflow

    element.style.maxHeight = 'none'
    element.style.overflow = 'visible'

    const fullHeight = element.scrollHeight

    element.style.maxHeight = previousMaxHeight
    element.style.overflow = previousOverflow

    setShowToggle(fullHeight > clampHeight + Math.max(1, lineHeight * 0.1))
  }, [content, maxLines])

  useLayoutEffect(() => {
    updateMeasurements()
  }, [updateMeasurements])

  useEffect(() => {
    const element = textRef.current
    if (!element) {
      return
    }

    const frameId = requestAnimationFrame(updateMeasurements)
    if (typeof ResizeObserver === 'undefined') {
      return () => {
        cancelAnimationFrame(frameId)
      }
    }
    const resizeObserver = new ResizeObserver(updateMeasurements)

    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [updateMeasurements])

  const toggle = useCallback(() => {
    setIsExpanded((expanded) => !expanded)
  }, [])

  const collapsedStyle = isExpanded
    ? undefined
    : buildCollapsedStyle(maxLines, maxHeightPx)

  return {
    isExpanded,
    toggle,
    showToggle,
    textRef,
    collapsedStyle,
  }
}

type CollapsibleTextToggleProps = {
  readonly isExpanded: boolean
  readonly onToggle: () => void
  readonly visible: boolean
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  readonly className?: string
  readonly showLabel?: boolean
}

export const CollapsibleTextToggle = ({
  isExpanded,
  onToggle,
  visible,
  onClick,
  className = '',
  showLabel = false,
}: CollapsibleTextToggleProps) => {
  const { t } = useTranslation()

  if (!visible) {
    return null
  }

  const stopInteraction = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopInteraction(event)
    onClick?.(event)
    onToggle()
  }

  const labelText = isExpanded ? t('show_less') : t('show_all')
  const ariaLabel = showLabel
    ? labelText
    : isExpanded
      ? t('collapse_text')
      : t('expand_text')

  const toneClass = showLabel ? 'btn-text-primary' : 'btn-text-muted'

  return (
    <button
      type="button"
      className={`btn-text ${toneClass} collapsible-text-toggle${showLabel ? ' collapsible-text-toggle--labeled' : ''} ${className}`.trim()}
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
      onClick={handleClick}
      onMouseDown={stopInteraction}
      onPointerDown={stopInteraction}
    >
      <i
        className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}
        aria-hidden="true"
      />
      {showLabel ? (
        <span className="collapsible-text-toggle-label">{labelText}</span>
      ) : null}
    </button>
  )
}

type CollapsibleTextProps = {
  readonly content: React.ReactNode
  readonly className?: string
  readonly as?: 'pre' | 'div'
  readonly isExpanded: boolean
  readonly textRef: React.RefObject<HTMLElement>
  readonly collapsedStyle?: CSSProperties
}

export const CollapsibleText = ({
  content,
  className = '',
  as: Tag = 'div',
  isExpanded,
  textRef,
  collapsedStyle,
}: CollapsibleTextProps) => {
  const combinedClassName = `collapsible-text ${className}`.trim()
  const style = isExpanded ? undefined : collapsedStyle

  if (Tag === 'pre') {
    return (
      <pre
        ref={textRef as React.RefObject<HTMLPreElement>}
        className={combinedClassName}
        style={style}
      >
        {content}
      </pre>
    )
  }

  return (
    <div
      ref={textRef as React.RefObject<HTMLDivElement>}
      className={combinedClassName}
      style={style}
    >
      {content}
    </div>
  )
}
