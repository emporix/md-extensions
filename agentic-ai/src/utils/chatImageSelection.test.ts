import { describe, expect, it } from 'vitest'
import {
  CHAT_IMAGE_MAX_BYTES,
  isChatAttachmentFile,
  safeImageName,
  selectChatImages,
  withChatAttachmentType,
} from './chatImageSelection'

const file = (name: string, type: string, size = 10) => ({ name, type, size })

describe('selectChatImages', () => {
  it('accepts the attachment types the service allows', () => {
    const files = [
      file('forest.png', 'image/png'),
      file('map.jpeg', 'image/jpeg'),
      file('photo.jpg', ''),
      file('notes.pdf', ''),
      file('rows.csv', 'application/vnd.ms-excel'),
    ]

    expect(files.every(isChatAttachmentFile)).toBe(true)
    expect(isChatAttachmentFile(file('plain.txt', 'text/plain'))).toBe(true)
    expect(isChatAttachmentFile(file('plain.txt', ''))).toBe(true)
    expect(isChatAttachmentFile(file('plain.text', ''))).toBe(true)
    expect(selectChatImages(0, files).accepted).toEqual(files)
  })

  it('rejects a mismatched mime and extension', () => {
    expect(isChatAttachmentFile(file('forest.png', 'image/jpeg'))).toBe(false)
    expect(isChatAttachmentFile(file('forest.jpg', 'image/png'))).toBe(false)
    expect(isChatAttachmentFile(file('page.svg', 'image/svg+xml'))).toBe(false)
    expect(isChatAttachmentFile(file('notes.md', 'text/markdown'))).toBe(false)
    expect(
      isChatAttachmentFile(file('rows.csv', 'application/vnd.ms-excel'))
    ).toBe(true)
  })

  it('uploads csv and pdf with the service content type', () => {
    const csv = withChatAttachmentType(
      new File(['a,b'], 'rows.csv', { type: 'application/vnd.ms-excel' })
    )
    const pdf = withChatAttachmentType(
      new File(['%PDF'], 'notes.pdf', { type: '' })
    )

    const txt = withChatAttachmentType(
      new File(['hello'], 'plain.txt', { type: '' })
    )

    expect(csv.type).toBe('text/csv')
    expect(pdf.type).toBe('application/pdf')
    expect(txt.type).toBe('text/plain')
  })

  it('keeps valid files and reports the first limit that failed', () => {
    const selected = selectChatImages(0, [
      file('ok.jpg', 'image/jpeg'),
      file('huge.png', 'image/png', CHAT_IMAGE_MAX_BYTES + 1),
    ])

    expect(selected.accepted.map((entry) => entry.name)).toEqual(['ok.jpg'])
    expect(selected.errorKey).toBe('chat_image_size')
  })

  it('stops when five images are already selected', () => {
    const selected = selectChatImages(5, [file('extra.png', 'image/png')])

    expect(selected.accepted).toEqual([])
    expect(selected.errorKey).toBe('chat_image_limit')
  })

  it('uses a safe display name', () => {
    expect(safeImageName('../secret\u0000.png')).toBe('secret.png')
    expect(safeImageName('   ')).toBe('file')
  })
})
