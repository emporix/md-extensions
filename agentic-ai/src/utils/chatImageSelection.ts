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

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** One kind of file the chat accepts: its extensions, the type sent to the
 * service, and the other types browsers report for it. */
type ChatAttachmentKind = {
  readonly extensions: readonly string[]
  readonly canonicalType: string
  readonly alsoReportedAs: readonly string[]
}

const CHAT_ATTACHMENT_KINDS: readonly ChatAttachmentKind[] = [
  {
    extensions: ['jpg', 'jpeg'],
    canonicalType: 'image/jpeg',
    alsoReportedAs: [''],
  },
  { extensions: ['png'], canonicalType: 'image/png', alsoReportedAs: [''] },
  {
    extensions: ['pdf'],
    canonicalType: 'application/pdf',
    alsoReportedAs: [''],
  },
  {
    extensions: ['csv'],
    canonicalType: 'text/csv',
    alsoReportedAs: ['application/vnd.ms-excel', 'text/plain', ''],
  },
  {
    extensions: ['txt', 'text'],
    canonicalType: 'text/plain',
    alsoReportedAs: [''],
  },
  {
    extensions: ['json'],
    canonicalType: 'application/json',
    alsoReportedAs: [''],
  },
  {
    extensions: ['xml'],
    canonicalType: 'application/xml',
    alsoReportedAs: ['text/xml', ''],
  },
  {
    extensions: ['html', 'htm'],
    canonicalType: 'text/html',
    alsoReportedAs: [''],
  },
  { extensions: ['xlsx'], canonicalType: XLSX_TYPE, alsoReportedAs: [''] },
]

const indexByExtension = (
  kinds: readonly ChatAttachmentKind[]
): ReadonlyMap<string, ChatAttachmentKind> =>
  new Map(
    kinds.flatMap((kind) => kind.extensions.map((ext) => [ext, kind] as const))
  )

const buildAcceptAttribute = (kinds: readonly ChatAttachmentKind[]): string => {
  const types = new Set(kinds.map((kind) => kind.canonicalType))
  const extensions = kinds.flatMap((kind) =>
    kind.extensions.map((ext) => `.${ext}`)
  )
  return [...types, ...extensions].join(',')
}

const KIND_BY_EXTENSION = indexByExtension(CHAT_ATTACHMENT_KINDS)

/** The file picker's accept attribute, derived from the same table. */
export const CHAT_ATTACHMENT_ACCEPT: string = buildAcceptAttribute(
  CHAT_ATTACHMENT_KINDS
)

export const isChatAttachmentFile = (file: ChatImageCandidate): boolean => {
  const kind = KIND_BY_EXTENSION.get(extensionOf(file.name))
  if (!kind) {
    return false
  }
  return (
    file.type === kind.canonicalType || kind.alsoReportedAs.includes(file.type)
  )
}

export const withChatAttachmentType = (file: File): File => {
  const kind = KIND_BY_EXTENSION.get(extensionOf(file.name))
  if (!kind || file.type === kind.canonicalType) {
    return file
  }
  return new File([file], file.name, {
    type: kind.canonicalType,
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
