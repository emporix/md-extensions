export const parseCsv = (source: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const text = source.replace(/^\uFEFF/, '')

  const pushRow = (): void => {
    row.push(cell)
    cell = ''
    if (row.some((value) => value !== '')) {
      rows.push(row)
    }
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char ?? ''
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1
      }
      pushRow()
      continue
    }
    cell += char ?? ''
  }

  if (cell !== '' || row.length > 0) {
    pushRow()
  }
  return rows
}
