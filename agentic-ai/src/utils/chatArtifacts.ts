export const MAX_ARTIFACT_DOWNLOAD_BYTES = 8 * 1024 * 1024
export const MAX_ARTIFACT_PREVIEW_CHARS = 80_000

export type ChatArtifact = {
  readonly artifactId?: string
  readonly generationId?: string
  readonly kind: 'image' | 'file'
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly status: 'ready' | 'failed' | 'pending'
  readonly errorCode?: string
}

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg'])
const PREVIEW_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/yaml',
  'application/xml',
])

const sameArtifact = (item: ChatArtifact, next: ChatArtifact): boolean => {
  if (next.generationId && item.generationId === next.generationId) {
    return true
  }
  return Boolean(next.artifactId && item.artifactId === next.artifactId)
}

export const appendChatArtifact = (
  artifacts: readonly ChatArtifact[] | undefined,
  next: ChatArtifact
): readonly ChatArtifact[] => {
  const current = artifacts ?? []
  const index = current.findIndex((item) => sameArtifact(item, next))
  if (index < 0) {
    return [...current, next]
  }
  const previous = current[index]
  const merged: ChatArtifact = {
    ...previous,
    ...next,
    artifactId: next.artifactId ?? previous.artifactId,
    generationId: next.generationId ?? previous.generationId,
  }
  if (
    merged.artifactId === previous.artifactId &&
    merged.generationId === previous.generationId &&
    merged.status === previous.status &&
    merged.size === previous.size &&
    merged.filename === previous.filename &&
    merged.errorCode === previous.errorCode
  ) {
    return current
  }
  const copy = current.slice()
  copy[index] = merged
  return copy
}

export const isPreviewableImage = (artifact: ChatArtifact): boolean =>
  artifact.status === 'ready' &&
  artifact.kind === 'image' &&
  IMAGE_MIME_TYPES.has(artifact.mimeType) &&
  Boolean(artifact.artifactId)

export const isPreviewableFile = (artifact: ChatArtifact): boolean =>
  artifact.status === 'ready' &&
  artifact.kind === 'file' &&
  PREVIEW_FILE_MIME_TYPES.has(artifact.mimeType) &&
  Boolean(artifact.artifactId)

export const isTextPreview = (mimeType: string): boolean =>
  PREVIEW_FILE_MIME_TYPES.has(mimeType) && mimeType !== 'application/pdf'

export const previewArtifactText = (
  bytes: Uint8Array
): { readonly text: string; readonly truncated: boolean } => {
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  if (decoded.length <= MAX_ARTIFACT_PREVIEW_CHARS) {
    return { text: decoded, truncated: false }
  }
  return {
    text: decoded.slice(0, MAX_ARTIFACT_PREVIEW_CHARS),
    truncated: true,
  }
}

export const artifactDownloadPath = (
  tenant: string,
  artifactId: string
): string =>
  `/media/${encodeURIComponent(tenant)}/assets/${encodeURIComponent(artifactId)}/download`

export type ArtifactSizeLabel = {
  readonly key:
    | 'chat_artifact_size_bytes'
    | 'chat_artifact_size_kb'
    | 'chat_artifact_size_mb'
  readonly value: string
}

export const formatArtifactSize = (size: number): ArtifactSizeLabel => {
  if (!Number.isFinite(size) || size < 0) {
    return { key: 'chat_artifact_size_bytes', value: '0' }
  }
  if (size < 1024) {
    return { key: 'chat_artifact_size_bytes', value: String(size) }
  }
  if (size < 1024 * 1024) {
    return {
      key: 'chat_artifact_size_kb',
      value: String(Math.ceil(size / 1024)),
    }
  }
  return {
    key: 'chat_artifact_size_mb',
    value: (size / (1024 * 1024)).toFixed(1),
  }
}

export const revokeObjectUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export const imagePreviewAfterLoadError = (url: string | null): 'failed' => {
  revokeObjectUrl(url)
  return 'failed'
}

export const safeArtifactFilename = (filename: string): string => {
  const base = filename.split(/[/\\]/).pop() ?? ''
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120)
  return cleaned || 'download'
}

export const artifactFailureKey = (kind: ChatArtifact['kind']): string =>
  kind === 'image' ? 'chat_artifact_image_failed' : 'chat_artifact_failed'
