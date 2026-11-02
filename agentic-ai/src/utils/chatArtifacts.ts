export const MAX_ARTIFACT_DOWNLOAD_BYTES = 8 * 1024 * 1024

export type ChatArtifact = {
  readonly artifactId?: string
  readonly kind: 'image' | 'file'
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly status: 'ready' | 'failed'
  readonly errorCode?: string
}

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg'])

export const appendChatArtifact = (
  artifacts: readonly ChatArtifact[] | undefined,
  next: ChatArtifact
): readonly ChatArtifact[] => {
  if (
    next.artifactId &&
    artifacts?.some((item) => item.artifactId === next.artifactId)
  ) {
    return artifacts ?? []
  }
  return [...(artifacts ?? []), next]
}

export const isPreviewableImage = (artifact: ChatArtifact): boolean =>
  artifact.status === 'ready' &&
  artifact.kind === 'image' &&
  IMAGE_MIME_TYPES.has(artifact.mimeType) &&
  Boolean(artifact.artifactId)

export const artifactDownloadPath = (
  tenant: string,
  artifactId: string
): string =>
  `/media/${encodeURIComponent(tenant)}/assets/${encodeURIComponent(artifactId)}/download`

export const formatArtifactSize = (size: number): string => {
  if (!Number.isFinite(size) || size < 0) {
    return '0 B'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export const revokeObjectUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export const safeArtifactFilename = (filename: string): string => {
  const base = filename.split(/[/\\]/).pop() ?? ''
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120)
  return cleaned || 'download'
}

export const artifactFailureKey = (kind: ChatArtifact['kind']): string =>
  kind === 'image' ? 'chat_artifact_image_failed' : 'chat_artifact_failed'
