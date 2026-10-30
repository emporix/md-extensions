import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Result, VisualizationSpec } from 'vega-embed'
import { useToast } from '../../contexts/ToastContext'
import {
  chartDownloadName,
  pngFilename,
  saveBlob,
  svgElementToPngBlob,
  vegaViewToPngBlob,
} from '../../utils/richContent/downloadPng'
import {
  externalUrlPaths,
  isVegaLiteSpec,
  vegaEmbedOptions,
} from '../../utils/richContent/vegaLiteGuard'
import {
  chartThemeConfig,
  prepareChartSpec,
  readChartThemeTokens,
} from '../../utils/richContent/vegaLitePresentation'
import { RichFrameDownload } from './RichFrameDownload'
import { RichResizeHandle } from './RichResizeHandle'
import { RichBlockInvalid, RichBlockPending } from './RichBlockStatus'
import { fitFrameSvg, useRichFrameResize } from './useRichFrameResize'
import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'

type VegaLiteViewProps = {
  readonly segment: VegaLiteSegment
}

const specRejected = (segment: VegaLiteSegment): boolean =>
  segment.kind === 'vega-lite' &&
  !(isVegaLiteSpec(segment.spec) && externalUrlPaths(segment.spec).length === 0)

export const VegaLiteView = ({ segment }: VegaLiteViewProps) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const viewRef = useRef<Result['view'] | null>(null)
  const [downloading, setDownloading] = useState(false)
  const { frameRef, canvasRef, startResize, onResizeRef } = useRichFrameResize()
  onResizeRef.current = () => {
    viewRef.current?.resize().run()
  }
  const [failedText, setFailedText] = useState<string | null>(null)
  const source = segment.text
  const kind = segment.kind
  const embedFailed = failedText === source
  const showInvalid =
    Boolean(segment.error) || specRejected(segment) || embedFailed

  useEffect(() => {
    if (kind !== 'vega-lite' || showInvalid) {
      return undefined
    }
    const node = canvasRef.current
    let parsed: unknown
    try {
      parsed = JSON.parse(source)
    } catch {
      return undefined
    }
    if (!node || !isVegaLiteSpec(parsed)) {
      return undefined
    }
    const spec = prepareChartSpec(parsed) as VisualizationSpec
    const handle = {
      cancelled: false,
      finalize: undefined as (() => void) | undefined,
    }
    void import('vega-embed')
      .then((module) => {
        if (handle.cancelled) {
          return undefined
        }
        return module.default(node, spec, {
          ...vegaEmbedOptions(),
          config: chartThemeConfig(readChartThemeTokens()),
        })
      })
      .then((result) => {
        if (!result) {
          return
        }
        viewRef.current = result.view
        result.view.resize().run()
        fitFrameSvg(node)
        handle.finalize = () => {
          viewRef.current = null
          result.view.finalize()
        }
        if (handle.cancelled) {
          handle.finalize()
        }
      })
      .catch((error: unknown) => {
        console.error(error)
        if (!handle.cancelled) {
          setFailedText(source)
        }
      })
    return () => {
      handle.cancelled = true
      handle.finalize?.()
    }
  }, [canvasRef, kind, showInvalid, source])

  if (segment.kind === 'vega-lite-pending') {
    return <RichBlockPending message={t('chat_chart_drawing')} />
  }

  if (showInvalid) {
    return (
      <RichBlockInvalid
        source={segment.text}
        message={t('chat_chart_invalid')}
      />
    )
  }

  if (segment.kind !== 'vega-lite') {
    return null
  }

  const handleDownload = () => {
    const view = viewRef.current
    const svg = canvasRef.current?.querySelector('svg')
    if (downloading) {
      return
    }
    if (!(svg instanceof SVGSVGElement) && !view) {
      showError(t('chat_download_failed'))
      return
    }

    const filename = pngFilename(
      chartDownloadName(segment.title, segment.spec),
      t('chat_chart_file')
    )
    const png =
      svg instanceof SVGSVGElement
        ? svgElementToPngBlob(svg)
        : view
          ? vegaViewToPngBlob(view)
          : Promise.reject(new Error('png'))

    setDownloading(true)
    void png
      .then((blob) => {
        saveBlob(blob, filename)
      })
      .catch((error: unknown) => {
        console.error('Failed to download chart', error)
        showError(t('chat_download_failed'))
      })
      .finally(() => {
        setDownloading(false)
      })
  }

  return (
    <div className="vega-lite-frame chat-block-wide" ref={frameRef}>
      <div className="vega-lite-view" ref={canvasRef} />
      <RichFrameDownload
        label={t('chat_download_png')}
        disabled={downloading}
        onClick={handleDownload}
      />
      <RichResizeHandle
        label={t('chat_chart_resize')}
        onPointerDown={startResize}
      />
    </div>
  )
}
