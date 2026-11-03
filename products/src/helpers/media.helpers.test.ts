import { describe, expect, it } from 'vitest'
import { FileType, getFileType, isImageFile } from './media.helpers'

describe('getFileType', () => {
  it('returns FILE for an empty filename', () => {
    expect(getFileType('')).toBe(FileType.FILE)
  })

  it('returns FILE for unknown or missing extensions', () => {
    expect(getFileType('archive.zip')).toBe(FileType.FILE)
    expect(getFileType('README')).toBe(FileType.FILE)
  })

  it('maps known extensions case-insensitively', () => {
    expect(getFileType('manual.PDF')).toBe(FileType.PDF)
    expect(getFileType('prices.XLSX')).toBe(FileType.SHEET)
    expect(getFileType('data.csv')).toBe(FileType.SHEET)
    expect(getFileType('notes.Docx')).toBe(FileType.TXT)
    expect(getFileType('config.json')).toBe(FileType.TXT)
    expect(getFileType('logo.PNG')).toBe(FileType.PNG)
    expect(getFileType('photo.JPG')).toBe(FileType.JPEG)
    expect(getFileType('photo.jpeg')).toBe(FileType.JPEG)
    expect(getFileType('icon.Svg')).toBe(FileType.IMAGE)
    expect(getFileType('anim.gif')).toBe(FileType.IMAGE)
  })

  it('uses only the last extension', () => {
    expect(getFileType('image.png.pdf')).toBe(FileType.PDF)
  })
})

describe('isImageFile', () => {
  it('treats png, jpeg and other image formats as images', () => {
    expect(isImageFile('a.png')).toBe(true)
    expect(isImageFile('a.JPEG')).toBe(true)
    expect(isImageFile('a.webp')).toBe(true)
  })

  it('treats documents, unknown and empty filenames as non-images', () => {
    expect(isImageFile('a.pdf')).toBe(false)
    expect(isImageFile('a.txt')).toBe(false)
    expect(isImageFile('a.zip')).toBe(false)
    expect(isImageFile('')).toBe(false)
  })
})
