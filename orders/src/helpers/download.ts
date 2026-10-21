const CSV_FILE_TYPE = 'text/csv;charset=utf-8;'

/** Escape a CSV cell so commas, quotes, and newlines do not break columns. */
export const escapeCsvCell = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const mapToCsv = <T>(
  headers: string[],
  models: T[],
  predicate: (model: T) => string[]
): string =>
  headers.map(escapeCsvCell).join(',') +
  '\n' +
  models
    .map(predicate)
    .map((row) => row.map(escapeCsvCell).join(','))
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
