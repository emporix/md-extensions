export type UploadedChatImage = {
  readonly attachmentId: string
  readonly purpose: string
  readonly caption: string
}

export type ChatImageUploadResult = {
  readonly id: string
  readonly sessionId?: string
}

export class ChatImageUploadError extends Error {
  readonly uploaded: readonly UploadedChatImage[]
  readonly sessionId: string | undefined

  constructor(
    cause: unknown,
    uploaded: readonly UploadedChatImage[],
    sessionId: string | undefined
  ) {
    super(cause instanceof Error ? cause.message : 'Chat image upload failed')
    this.name = cause instanceof Error ? cause.name : 'ChatImageUploadError'
    this.uploaded = uploaded
    this.sessionId = sessionId
  }
}

export const uploadChatImagesInOrder = async (
  images: readonly {
    readonly file: File
    readonly name: string
    readonly attachmentId?: string
  }[],
  upload: (
    file: File,
    sessionId: string | undefined
  ) => Promise<ChatImageUploadResult>,
  sessionId: string | undefined
): Promise<{
  readonly attachments: readonly UploadedChatImage[]
  readonly sessionId: string | undefined
}> => {
  let currentSession = sessionId
  const attachments: UploadedChatImage[] = []
  for (const image of images) {
    if (image.attachmentId) {
      attachments.push({
        attachmentId: image.attachmentId,
        purpose: 'chat image',
        caption: image.name,
      })
      continue
    }
    try {
      const uploaded = await upload(image.file, currentSession)
      if (uploaded.sessionId) {
        currentSession = uploaded.sessionId
      }
      attachments.push({
        attachmentId: uploaded.id,
        purpose: 'chat image',
        caption: image.name,
      })
    } catch (err) {
      throw new ChatImageUploadError(err, attachments, currentSession)
    }
  }
  return { attachments, sessionId: currentSession }
}
