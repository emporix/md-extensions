const CSV_FILE_TYPE = 'text/csv;charset=utf-8;'

export const mapToCsv = <T>(
  headers: string[],
  models: T[],
  predicate: (model: T) => string[]
): string =>
  headers.join(',') +
  '\n' +
  models
    .map(predicate)
    .map((row) => row.join(','))
    .join('\n')

const downloadFile = (blob: Blob, filename: string) => {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const saveToCsvFile = (filename: string, data: string) => {
  downloadFile(new Blob([data], { type: CSV_FILE_TYPE }), filename)
}
