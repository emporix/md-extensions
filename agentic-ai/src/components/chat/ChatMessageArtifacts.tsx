import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiClient } from '../../services/apiClient'
import { AppState } from '../../types/common'
import { RichFrameDownload } from './RichFrameDownload'
import {
  artifactDownloadPath,
  artifactFailureKey,
  formatArtifactSize,
  imagePreviewAfterLoadError,
  isPreviewableFile,
  isPreviewableImage,
  isTextPreview,
  MAX_ARTIFACT_DOWNLOAD_BYTES,
  previewArtifactText,
  revokeObjectUrl,
  safeArtifactFilename,
  type ChatArtifact,
} from '../../utils/chatArtifacts'

type ChatMessageArtifactsProps = {
  readonly appState: AppState
  readonly artifacts: readonly ChatArtifact[]
}

const saveObjectUrl = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const PdfPreviewFrame = ({
  title,
  src,
}: {
  readonly title: string
  readonly src: string
}) => (
  // Chrome blocks its PDF viewer in every sandboxed frame.
  // The blob type is application/pdf, so this frame is the viewer, not an HTML document.
  <iframe
    className="agent-chat-artifact-pdf"
    title={title}
    src={src}
    referrerPolicy="no-referrer"
  />
)

const ChatImagePreview = ({
  appState,
  artifact,
}: {
  readonly appState: AppState
  readonly artifact: ChatArtifact
}) => {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const artifactId = artifact.artifactId ?? ''
  const { tenant, token, language, contentLanguage } = appState

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | null = null
    let cancelled = false
    const clientState = { tenant, token, language, contentLanguage }

    const load = async () => {
      try {
        const bytes = await new ApiClient(clientState).getBoundedArrayBuffer(
          artifactDownloadPath(tenant, artifactId),
          MAX_ARTIFACT_DOWNLOAD_BYTES,
          { signal: controller.signal }
        )
        if (cancelled) {
          return
        }
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: artifact.mimeType })
        )
        setUrl(objectUrl)
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
      revokeObjectUrl(objectUrl)
    }
  }, [tenant, token, language, contentLanguage, artifact.mimeType, artifactId])

  if (failed) {
    return (
      <p className="agent-chat-artifact-error">
        {t(artifactFailureKey('image'))}
      </p>
    )
  }
  if (!url) {
    return null
  }
  const filename = safeArtifactFilename(artifact.filename)
  const downloadLabel =
    artifact.mimeType === 'image/jpeg'
      ? t('chat_download_jpeg')
      : t('chat_download_png')
  return (
    <div className="agent-chat-artifact-image-block">
      <img
        className="agent-chat-artifact-image"
        src={url}
        alt={filename}
        onError={() => {
          imagePreviewAfterLoadError(url)
          setUrl(null)
          setFailed(true)
        }}
      />
      <RichFrameDownload
        label={downloadLabel}
        disabled={false}
        onClick={() => saveObjectUrl(url, filename)}
      />
    </div>
  )
}

const ChatImagePending = () => {
  const { t } = useTranslation()
  return (
    <p className="agent-chat-artifact-pending" role="status">
      {t('chat_artifact_generating_image')}
    </p>
  )
}

const ChatFileCard = ({
  appState,
  artifact,
}: {
  readonly appState: AppState
  readonly artifact: ChatArtifact
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const bytesRef = useRef<ArrayBuffer | null>(null)
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null)
  const filename = safeArtifactFilename(artifact.filename)
  const previewable = isPreviewableFile(artifact)
  const artifactId = artifact.artifactId ?? ''
  const { tenant, token, language, contentLanguage } = appState
  const summary = `${filename} · ${artifact.mimeType} · ${formatArtifactSize(artifact.size)}`

  const ensureBytes = async (signal: AbortSignal) => {
    if (bytesRef.current) {
      return bytesRef.current
    }
    const loaded = await new ApiClient({
      tenant,
      token,
      language,
      contentLanguage,
    }).getBoundedArrayBuffer(
      artifactDownloadPath(tenant, artifactId),
      MAX_ARTIFACT_DOWNLOAD_BYTES,
      { signal }
    )
    bytesRef.current = loaded
    setBytes(loaded)
    return loaded
  }

  useEffect(() => {
    if (!open || !artifactId || bytesRef.current) {
      return undefined
    }
    const controller = new AbortController()
    let cancelled = false
    const load = async () => {
      try {
        if (bytesRef.current) {
          return
        }
        const loaded = await new ApiClient({
          tenant,
          token,
          language,
          contentLanguage,
        }).getBoundedArrayBuffer(
          artifactDownloadPath(tenant, artifactId),
          MAX_ARTIFACT_DOWNLOAD_BYTES,
          { signal: controller.signal }
        )
        if (cancelled) {
          return
        }
        bytesRef.current = loaded
        setBytes(loaded)
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open, artifactId, tenant, token, language, contentLanguage])

  useEffect(() => {
    if (!open || artifact.mimeType !== 'application/pdf' || !bytes) {
      return undefined
    }
    const url = URL.createObjectURL(
      new Blob([bytes], { type: 'application/pdf' })
    )
    setPdfUrl(url)
    return () => {
      revokeObjectUrl(url)
      setPdfUrl(null)
    }
  }, [open, bytes, artifact.mimeType])

  const download = async () => {
    if (!artifactId) {
      setFailed(true)
      return
    }
    const controller = new AbortController()
    try {
      const loaded = await ensureBytes(controller.signal)
      const url = URL.createObjectURL(
        new Blob([loaded], { type: artifact.mimeType })
      )
      saveObjectUrl(url, filename)
      window.setTimeout(() => revokeObjectUrl(url), 0)
    } catch {
      setFailed(true)
    }
  }

  const textPreview =
    open && bytes && isTextPreview(artifact.mimeType)
      ? previewArtifactText(new Uint8Array(bytes))
      : null

  return (
    <div className="agent-chat-artifact-file">
      {previewable ? (
        <button
          type="button"
          className="agent-chat-artifact-toggle"
          aria-expanded={open}
          aria-label={t(
            open ? 'chat_artifact_collapse' : 'chat_artifact_expand',
            { name: filename }
          )}
          onClick={() => setOpen((current) => !current)}
        >
          <i
            className={open ? 'pi pi-chevron-down' : 'pi pi-chevron-right'}
            aria-hidden="true"
          />
          <span>{summary}</span>
        </button>
      ) : (
        <span>{summary}</span>
      )}
      <RichFrameDownload
        label={t('chat_artifact_download')}
        disabled={!artifactId}
        onClick={() => void download()}
      />
      {textPreview ? (
        <div className="agent-chat-artifact-preview">
          <pre className="agent-chat-artifact-text">{textPreview.text}</pre>
          {textPreview.truncated ? (
            <p className="agent-chat-artifact-note">
              {t('chat_artifact_preview_truncated')}
            </p>
          ) : null}
        </div>
      ) : null}
      {open && pdfUrl ? (
        <PdfPreviewFrame title={filename} src={pdfUrl} />
      ) : null}
      {failed ? (
        <p className="agent-chat-artifact-error">
          {t(artifactFailureKey('file'))}
        </p>
      ) : null}
    </div>
  )
}

const ChatMessageArtifacts = ({
  appState,
  artifacts,
}: ChatMessageArtifactsProps) => {
  const { t } = useTranslation()
  if (artifacts.length === 0) {
    return null
  }

  return (
    <div className="agent-chat-artifacts">
      {artifacts.map((artifact, index) => {
        const key =
          artifact.generationId ??
          artifact.artifactId ??
          `${artifact.filename}-${index}`
        if (artifact.status === 'pending') {
          return <ChatImagePending key={key} />
        }
        if (artifact.status === 'failed') {
          return (
            <p key={key} className="agent-chat-artifact-error">
              {t(artifactFailureKey(artifact.kind))}
            </p>
          )
        }
        if (isPreviewableImage(artifact)) {
          return (
            <ChatImagePreview
              key={key}
              appState={appState}
              artifact={artifact}
            />
          )
        }
        return (
          <ChatFileCard key={key} appState={appState} artifact={artifact} />
        )
      })}
    </div>
  )
}

export default ChatMessageArtifacts
