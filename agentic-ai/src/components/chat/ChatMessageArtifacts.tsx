import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiClient } from '../../services/apiClient'
import { AppState } from '../../types/common'
import {
  artifactDownloadPath,
  artifactFailureKey,
  formatArtifactSize,
  isPreviewableImage,
  MAX_ARTIFACT_DOWNLOAD_BYTES,
  revokeObjectUrl,
  safeArtifactFilename,
  type ChatArtifact,
} from '../../utils/chatArtifacts'

type ChatMessageArtifactsProps = {
  readonly appState: AppState
  readonly artifacts: readonly ChatArtifact[]
}

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
  return (
    <img
      className="agent-chat-artifact-image"
      src={url}
      alt={safeArtifactFilename(artifact.filename)}
    />
  )
}

const ChatFileDownload = ({
  appState,
  artifact,
}: {
  readonly appState: AppState
  readonly artifact: ChatArtifact
}) => {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  const download = async () => {
    const artifactId = artifact.artifactId
    if (!artifactId) {
      setFailed(true)
      return
    }
    try {
      const bytes = await new ApiClient(appState).getBoundedArrayBuffer(
        artifactDownloadPath(appState.tenant, artifactId),
        MAX_ARTIFACT_DOWNLOAD_BYTES
      )
      const url = URL.createObjectURL(
        new Blob([bytes], { type: artifact.mimeType })
      )
      const link = document.createElement('a')
      link.href = url
      link.download = safeArtifactFilename(artifact.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => revokeObjectUrl(url), 0)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="agent-chat-artifact-file">
      <span>
        {safeArtifactFilename(artifact.filename)} · {artifact.mimeType} ·{' '}
        {formatArtifactSize(artifact.size)}
      </span>
      <button type="button" onClick={() => void download()}>
        {t('chat_artifact_download')}
      </button>
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
        const key = artifact.artifactId ?? `${artifact.filename}-${index}`
        if (artifact.status === 'failed') {
          return (
            <p key={key} className="agent-chat-artifact-error">
              {t('chat_artifact_failed')}
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
          <ChatFileDownload key={key} appState={appState} artifact={artifact} />
        )
      })}
    </div>
  )
}

export default ChatMessageArtifacts
