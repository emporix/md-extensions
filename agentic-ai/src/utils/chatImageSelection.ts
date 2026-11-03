export const CHAT_IMAGE_LIMIT = 5
export const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024

export type ChatImageCandidate = {
  readonly name: string
  readonly type: string
  readonly size: number
}

export type ChatImageSelection<T extends ChatImageCandidate> = {
  readonly accepted: readonly T[]
  readonly errorKey:
    | 'chat_image_limit'
    | 'chat_image_size'
    | 'chat_image_type'
    | null
}

export const safeImageName = (name: string): string => {
  const base = name.split(/[/\\]/).pop() ?? ''
  const cleaned = Array.from(base)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0
      return code >= 32 && code !== 127
    })
    .join('')
    .trim()
    .slice(0, 120)
  return cleaned.length > 0 ? cleaned : 'file'
}

export const newChatAttachmentKey = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `file-${Date.now()}`

const extensionOf = (name: string): string => {
  const base = name.split(/[/\\]/).pop() ?? ''
  const extension = base.includes('.') ? (base.split('.').pop() ?? '') : ''
  return extension.toLowerCase()
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  csv: 'text/csv',
  txt: 'text/plain',
  text: 'text/plain',
}

const ACCEPTED_TYPES_BY_EXTENSION: Record<string, readonly string[]> = {
  jpg: ['image/jpeg', ''],
  jpeg: ['image/jpeg', ''],
  png: ['image/png', ''],
  pdf: ['application/pdf', ''],
  csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain', ''],
  txt: ['text/plain', ''],
  text: ['text/plain', ''],
}

export const isChatAttachmentFile = (file: ChatImageCandidate): boolean => {
  const accepted = ACCEPTED_TYPES_BY_EXTENSION[extensionOf(file.name)]
  return accepted?.includes(file.type) ?? false
}

export const withChatAttachmentType = (file: File): File => {
  const mime = MIME_BY_EXTENSION[extensionOf(file.name)]
  if (!mime || file.type === mime) {
    return file
  }
  return new File([file], file.name, {
    type: mime,
    lastModified: file.lastModified,
  })
}

export const selectChatImages = <T extends ChatImageCandidate>(
  existingCount: number,
  files: readonly T[]
): ChatImageSelection<T> => {
  const accepted: T[] = []
  let errorKey: ChatImageSelection<T>['errorKey'] = null
  let count = existingCount
  for (const file of files) {
    if (count >= CHAT_IMAGE_LIMIT) {
      errorKey = 'chat_image_limit'
      break
    }
    if (!isChatAttachmentFile(file)) {
      errorKey = 'chat_image_type'
      continue
    }
    if (file.size > CHAT_IMAGE_MAX_BYTES) {
      errorKey = 'chat_image_size'
      continue
    }
    accepted.push(file)
    count += 1
  }
  return { accepted, errorKey }
}
