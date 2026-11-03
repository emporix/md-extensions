import { describe, expect, it, vi } from 'vitest'
import {
  ChatImageUploadError,
  uploadChatImagesInOrder,
} from './chatImageUpload'

const file = (name: string) => new File(['image'], name, { type: 'image/png' })

describe('uploadChatImagesInOrder', () => {
  it('threads the session from the first upload into the next one', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ id: 'asset-1', sessionId: 'session-1' })
      .mockResolvedValueOnce({ id: 'asset-2', sessionId: 'session-1' })

    const result = await uploadChatImagesInOrder(
      [
        { file: file('one.png'), name: 'one.png' },
        { file: file('two.png'), name: 'two.png' },
      ],
      upload,
      undefined
    )

    expect(upload.mock.calls.map((call) => call[1])).toEqual([
      undefined,
      'session-1',
    ])
    expect(result.sessionId).toBe('session-1')
    expect(result.attachments).toEqual([
      { attachmentId: 'asset-1', purpose: 'chat image', caption: 'one.png' },
      { attachmentId: 'asset-2', purpose: 'chat image', caption: 'two.png' },
    ])
  })

  it('stops after the first failed upload', async () => {
    const upload = vi
      .fn()
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({ id: 'asset-2' })

    await expect(
      uploadChatImagesInOrder(
        [
          { file: file('one.png'), name: 'one.png' },
          { file: file('two.png'), name: 'two.png' },
        ],
        upload,
        'session-1'
      )
    ).rejects.toThrow('upload failed')
    expect(upload).toHaveBeenCalledTimes(1)
  })

  it('keeps earlier uploads when a later file fails', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ id: 'asset-1', sessionId: 'session-2' })
      .mockRejectedValueOnce(new Error('upload failed'))

    const failure = uploadChatImagesInOrder(
      [
        { file: file('one.png'), name: 'one.png' },
        { file: file('two.png'), name: 'two.png' },
      ],
      upload,
      undefined
    )

    await expect(failure).rejects.toBeInstanceOf(ChatImageUploadError)
    await expect(failure).rejects.toMatchObject({
      message: 'upload failed',
      sessionId: 'session-2',
      uploaded: [
        { attachmentId: 'asset-1', purpose: 'chat image', caption: 'one.png' },
      ],
    })
    expect(upload).toHaveBeenCalledTimes(2)
  })

  it('reuses an attachment id instead of uploading it again', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ id: 'asset-2', sessionId: 'session-1' })

    const result = await uploadChatImagesInOrder(
      [
        { file: file('one.png'), name: 'one.png', attachmentId: 'asset-1' },
        { file: file('two.png'), name: 'two.png' },
      ],
      upload,
      'session-1'
    )

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0]?.[1]).toBe('session-1')
    expect(result.attachments.map((item) => item.attachmentId)).toEqual([
      'asset-1',
      'asset-2',
    ])
  })
})
