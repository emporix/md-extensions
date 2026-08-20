export enum FileType {
  JPEG = 'jpeg',
  PNG = 'png',
  IMAGE = 'image',
  TXT = 'txt',
  PDF = 'pdf',
  SHEET = 'sheet',
  FILE = 'file',
}

export const getFileType = (filename: string): FileType => {
  if (!filename) return FileType.FILE
  const lowerFilename = filename.toLowerCase()
  switch (true) {
    case lowerFilename.endsWith('.pdf'):
      return FileType.PDF
    case lowerFilename.endsWith('.xls') ||
      lowerFilename.endsWith('.xlsx') ||
      lowerFilename.endsWith('.csv') ||
      lowerFilename.endsWith('.xlsm') ||
      lowerFilename.endsWith('.xlsb') ||
      lowerFilename.endsWith('.gsheet'):
      return FileType.SHEET
    case lowerFilename.endsWith('.doc') ||
      lowerFilename.endsWith('.docx') ||
      lowerFilename.endsWith('.rtf') ||
      lowerFilename.endsWith('.odt') ||
      lowerFilename.endsWith('.gdoc') ||
      lowerFilename.endsWith('.json') ||
      lowerFilename.endsWith('.txt'):
      return FileType.TXT
    case lowerFilename.endsWith('.png'):
      return FileType.PNG
    case lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg'):
      return FileType.JPEG
    case lowerFilename.endsWith('.gif') ||
      lowerFilename.endsWith('.bmp') ||
      lowerFilename.endsWith('.webp') ||
      lowerFilename.endsWith('.svg'):
      return FileType.IMAGE
    default:
      return FileType.FILE
  }
}

export const isImageFile = (filename: string) => {
  const result = getFileType(filename)
  return (
    result === FileType.IMAGE ||
    result === FileType.PNG ||
    result === FileType.JPEG
  )
}
