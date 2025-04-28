const CSV_FILE_TYPE = 'text/csv;charset=utf-8;'
const PDF_FILE_TYPE = 'application/pdf'
const HREF_ATTRIBUTE = 'href'
const DOWNLOAD_ATTRIBUTE = 'download'
const VISIBILITY_HIDDEN_STYLE = 'hidden'
const ANCHOR_TAG_NAME = 'a'

export const mapToCsv = <T>(
  headers: string[],
  models: T[],
  predicate: (t: T) => string[]
) => {
  return (
    headers.join(',') +
    '\n' +
    models
      .map(predicate)
      .map((e) => e.join(','))
      .join('\n')
  )
}

function downloadFile(blob: Blob, filename: string) {
  const link = document.createElement(ANCHOR_TAG_NAME)
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute(HREF_ATTRIBUTE, url)
    link.setAttribute(DOWNLOAD_ATTRIBUTE, filename)
    link.style.visibility = VISIBILITY_HIDDEN_STYLE
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const saveToCsvFile = (filename: string, data: string) => {
  const blob = new Blob([data], { type: CSV_FILE_TYPE })
  downloadFile(blob, filename)
}

export const saveToPDFFile = (filename: string, data: string) => {
  const blob = new Blob([data], { type: PDF_FILE_TYPE })
  downloadFile(blob, filename)
}
