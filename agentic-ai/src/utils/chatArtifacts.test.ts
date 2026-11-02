import { describe, expect, it, vi } from 'vitest'
import {
  appendChatArtifact,
  artifactDownloadPath,
  artifactFailureKey,
  formatArtifactSize,
  isPreviewableImage,
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
    expect(formatArtifactSize(2048)).toBe('2 KB')
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

  it('maps a failed image or file to a local message key', () => {
    expect(artifactFailureKey('image')).toBe('chat_artifact_image_failed')
    expect(artifactFailureKey('file')).toBe('chat_artifact_failed')
    expect(artifactFailureKey('image')).not.toBe(artifactFailureKey('file'))
  })
})
