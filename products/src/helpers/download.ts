const CSV_FILE_TYPE = 'text/csv;charset=utf-8;'

const FORMULA_PREFIX = /^[=+\-@\t\r]/

/**
 * Neutralize spreadsheet formula injection, then quote cells that need it
 * (commas, quotes, newlines — RFC 4180).
 */
export const escapeCsvCell = (value: string): string => {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value
  if (/[",\n\r]/.test(safe) || safe !== value) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
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
