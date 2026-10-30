import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../contexts/ToastContext'
import {
  diagramDownloadName,
  pngFilename,
  saveBlob,
  svgElementToPngBlob,
} from '../../utils/richContent/downloadPng'
import {
  isBlockedMermaidSource,
  prepareMermaidSource,
  sanitizeMermaidSvg,
} from '../../utils/richContent/mermaidGuard'
import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'
import { RichFrameDownload } from './RichFrameDownload'
import { RichResizeHandle } from './RichResizeHandle'
import { RichBlockInvalid, RichBlockPending } from './RichBlockStatus'
import { fitFrameSvg, useRichFrameResize } from './useRichFrameResize'

type MermaidViewProps = {
  readonly segment: VegaLiteSegment
}

const diagramId = (rawId: string): string =>
  `diagram-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

export const MermaidView = ({ segment }: MermaidViewProps) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const reactId = useId()
  const { frameRef, canvasRef, startResize } = useRichFrameResize()
  const [failedText, setFailedText] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const kind = segment.kind
  const source =
    kind === 'mermaid' ? prepareMermaidSource(segment.text) : segment.text
  const blocked = kind === 'mermaid' && isBlockedMermaidSource(source)
  const showInvalid = blocked || failedText === source

  useEffect(() => {
    if (kind !== 'mermaid' || showInvalid) {
      return undefined
    }
    const node = canvasRef.current
    if (!node) {
      return undefined
    }
    const handle = { cancelled: false }
    void import('mermaid')
      .then(async (module) => {
        if (handle.cancelled) {
          return
        }
        const mermaid = module.default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          htmlLabels: false,
          suppressErrorRendering: true,
        })
        // bindFunctions attaches click handlers, so the render result is inserted without it.
        const rendered = await mermaid.render(diagramId(reactId), source)
        if (handle.cancelled) {
          return
        }
        const svg = sanitizeMermaidSvg(rendered.svg)
        if (!svg) {
          setFailedText(source)
          return
        }
        node.replaceChildren(document.importNode(svg, true))
        fitFrameSvg(node)
      })
      .catch((error: unknown) => {
        console.error(error)
        if (!handle.cancelled) {
          setFailedText(source)
        }
      })
    return () => {
      handle.cancelled = true
      node.replaceChildren()
    }
  }, [canvasRef, kind, reactId, showInvalid, source])

  if (segment.kind === 'mermaid-pending') {
    return <RichBlockPending message={t('chat_diagram_drawing')} />
  }

  if (segment.kind !== 'mermaid') {
    return null
  }

  if (showInvalid) {
    return (
      <RichBlockInvalid
        source={segment.text}
        message={t('chat_diagram_invalid')}
      />
    )
  }

  const handleDownload = () => {
    const svg = canvasRef.current?.querySelector('svg')
    if (downloading) {
      return
    }
    if (!(svg instanceof SVGSVGElement)) {
      showError(t('chat_download_failed'))
      return
    }

    setDownloading(true)
    void svgElementToPngBlob(svg)
      .then((blob) => {
        saveBlob(
          blob,
          pngFilename(
            diagramDownloadName(segment.title, segment.text),
            t('chat_diagram_file')
          )
        )
      })
      .catch((error: unknown) => {
        console.error('Failed to download diagram', error)
        showError(t('chat_download_failed'))
      })
      .finally(() => {
        setDownloading(false)
      })
  }

  return (
    <div className="mermaid-frame chat-block-wide" ref={frameRef}>
      <div className="mermaid-view" ref={canvasRef} />
      <RichFrameDownload
        label={t('chat_download_png')}
        disabled={downloading}
        onClick={handleDownload}
      />
      <RichResizeHandle
        label={t('chat_diagram_resize')}
        onPointerDown={startResize}
      />
    </div>
  )
}
