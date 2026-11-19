import { describe, expect, it } from 'vitest'
import TRANSLATIONS_DE from '../translations/de'
import TRANSLATIONS_EN from '../translations/en'
import {
  CHAT_ATTACHMENT_ACCEPT,
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

describe('COP-7048 structured data attachments', () => {
  const XLSX =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  // Scenario 16: keep the new kinds whatever the browser reports, upload them canonical.
  const accepted: readonly [string, string, string][] = [
    ['order.json', 'application/json', 'application/json'],
    ['order.json', '', 'application/json'],
    ['order.xml', 'application/xml', 'application/xml'],
    ['order.xml', 'text/xml', 'application/xml'],
    ['order.xml', '', 'application/xml'],
    ['page.html', 'text/html', 'text/html'],
    ['page.htm', '', 'text/html'],
    ['orders.xlsx', XLSX, XLSX],
    ['orders.xlsx', '', XLSX],
  ]

  it.each(accepted)(
    'keeps %s reported as "%s" and uploads it as %s',
    (name, reported, canonical) => {
      expect(isChatAttachmentFile(file(name, reported))).toBe(true)
      expect(selectChatImages(0, [file(name, reported)]).errorKey).toBeNull()
      expect(
        withChatAttachmentType(new File(['x'], name, { type: reported })).type
      ).toBe(canonical)
    }
  )

  it('offers the new kinds in the file picker', () => {
    const accept = CHAT_ATTACHMENT_ACCEPT.split(',')
    for (const entry of ['.json', '.xml', '.html', '.htm', '.xlsx', XLSX]) {
      expect(accept).toContain(entry)
    }
    for (const old of [
      '.jpg',
      '.jpeg',
      '.png',
      '.pdf',
      '.csv',
      '.txt',
      '.text',
    ]) {
      expect(accept).toContain(old)
    }
  })

  // Scenario 17: legacy Excel stays out, and the message names what is allowed.
  it('refuses .xls files', () => {
    for (const reported of ['application/vnd.ms-excel', '', XLSX]) {
      const selection = selectChatImages(0, [file('report.xls', reported)])
      expect(selection.accepted).toEqual([])
      expect(selection.errorKey).toBe('chat_image_type')
    }
    expect(CHAT_ATTACHMENT_ACCEPT.split(',')).not.toContain('.xls')
    expect(isChatAttachmentFile(file('order.json', 'text/html'))).toBe(false)
  })

  it('names the supported kinds in the unsupported-type message', () => {
    for (const message of [
      TRANSLATIONS_EN.chat_image_type,
      TRANSLATIONS_DE.chat_image_type,
    ]) {
      for (const kind of [
        'PNG',
        'JPEG',
        'PDF',
        'CSV',
        'JSON',
        'XML',
        'HTML',
        'XLSX',
      ]) {
        expect(message).toContain(kind)
      }
      expect(message).not.toMatch(/\bXLS\b/)
    }
  })
})
