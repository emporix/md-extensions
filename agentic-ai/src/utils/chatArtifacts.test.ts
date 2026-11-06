import { describe, expect, it, vi } from 'vitest'
import {
  appendChatArtifact,
  artifactDownloadPath,
  artifactFailureKey,
  formatArtifactSize,
  isPreviewableFile,
  isPreviewableImage,
  MAX_ARTIFACT_PREVIEW_CHARS,
  imagePreviewAfterLoadError,
  previewArtifactText,
  revokeObjectUrl,
  safeArtifactFilename,
  type ChatArtifact,
} from './chatArtifacts'

const image: ChatArtifact = {
  artifactId: 'asset-1',
  kind: 'image',
  filename: 'forest.png',
  mimeType: 'image/png',
  size: 2048,
  status: 'ready',
}

describe('chatArtifacts', () => {
  it('appends an artifact without changing the previous list', () => {
    const current = [image]
    const next = appendChatArtifact(current, {
      ...image,
      artifactId: 'asset-2',
      filename: 'notes.txt',
      kind: 'file',
      mimeType: 'text/plain',
    })

    expect(current).toHaveLength(1)
    expect(next).toHaveLength(2)
    expect(next[0]).toBe(image)
  })

  it('ignores a repeated artifact id', () => {
    expect(appendChatArtifact([image], image)).toHaveLength(1)
  })

  it('previews only a ready png or jpeg with an id', () => {
    expect(isPreviewableImage(image)).toBe(true)
    expect(isPreviewableImage({ ...image, mimeType: 'image/svg+xml' })).toBe(
      false
    )
    expect(isPreviewableImage({ ...image, status: 'failed' })).toBe(false)
    expect(isPreviewableImage({ ...image, artifactId: undefined })).toBe(false)
  })

  it('builds an authenticated media path and a readable size', () => {
    expect(artifactDownloadPath('tenant a', 'asset/1')).toBe(
      '/media/tenant%20a/assets/asset%2F1/download'
    )
    expect(formatArtifactSize(2048)).toEqual({
      key: 'chat_artifact_size_kb',
      value: '2',
    })
  })

  it('keeps a safe download name and revokes object URLs', () => {
    expect(safeArtifactFilename('../forest animals.png')).toBe(
      'forest_animals.png'
    )
    expect(safeArtifactFilename('')).toBe('download')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revoke })
    revokeObjectUrl('blob:forest')
    revokeObjectUrl(null)
    expect(revoke).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('drops a preview URL when the browser cannot draw the image', () => {
    const revoke = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revoke })

    expect(imagePreviewAfterLoadError('blob:forest')).toBe('failed')
    expect(revoke).toHaveBeenCalledWith('blob:forest')
    vi.unstubAllGlobals()
  })

  it('replaces a pending image when the same generation finishes', () => {
    const pending: ChatArtifact = {
      generationId: 'ig_forest',
      kind: 'image',
      filename: 'image.png',
      mimeType: 'image/png',
      size: 0,
      status: 'pending',
    }
    const ready: ChatArtifact = {
      ...image,
      generationId: 'ig_forest',
    }

    const next = appendChatArtifact([pending], ready)

    expect(next).toHaveLength(1)
    expect(next[0]?.status).toBe('ready')
    expect(next[0]?.artifactId).toBe('asset-1')
    expect(next[0]?.generationId).toBe('ig_forest')
  })

  it('previews safe files and truncates long text', () => {
    const pdf: ChatArtifact = {
      artifactId: 'asset-pdf',
      kind: 'file',
      filename: 'notes.pdf',
      mimeType: 'application/pdf',
      size: 12,
      status: 'ready',
    }
    expect(isPreviewableFile(pdf)).toBe(true)
    expect(
      isPreviewableFile({
        ...pdf,
        mimeType: 'text/html',
        filename: 'page.html',
      })
    ).toBe(false)
    expect(isPreviewableFile({ ...pdf, mimeType: 'image/svg+xml' })).toBe(false)

    const body = new Uint8Array(MAX_ARTIFACT_PREVIEW_CHARS + 5).fill(65)
    const preview = previewArtifactText(body)
    expect(preview.truncated).toBe(true)
    expect(preview.text).toHaveLength(MAX_ARTIFACT_PREVIEW_CHARS)
    expect(previewArtifactText(new Uint8Array([65, 66])).truncated).toBe(false)
  })

  it('maps a failed image or file to a local message key', () => {
    expect(artifactFailureKey('image')).toBe('chat_artifact_image_failed')
    expect(artifactFailureKey('file')).toBe('chat_artifact_failed')
    expect(artifactFailureKey('image')).not.toBe(artifactFailureKey('file'))
  })
})
