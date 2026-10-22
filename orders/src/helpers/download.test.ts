import { describe, expect, it } from 'vitest'
import { escapeCsvCell, mapToCsv } from './download'

describe('escapeCsvCell', () => {
  it('leaves plain values unchanged', () => {
    expect(escapeCsvCell('Acme')).toBe('Acme')
  })

  it('quotes values that contain commas', () => {
    expect(escapeCsvCell('Acme, Inc.')).toBe('"Acme, Inc."')
  })

  it('doubles embedded quotes', () => {
    expect(escapeCsvCell('Say "hi"')).toBe('"Say ""hi"""')
  })

  it('quotes values that contain newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('neutralizes spreadsheet formula prefixes', () => {
    expect(escapeCsvCell('=1+1')).toBe('"\'=1+1"')
    expect(escapeCsvCell('+cmd')).toBe('"\'+cmd"')
    expect(escapeCsvCell('-1')).toBe('"\'-1"')
    expect(escapeCsvCell('@sum')).toBe('"\'@sum"')
  })
})

describe('mapToCsv', () => {
  it('escapes headers and row cells so column counts stay aligned', () => {
    const csv = mapToCsv(
      ['id', 'company'],
      [{ id: '1', company: 'Acme, Inc.' }],
      (row) => [row.id, row.company]
    )

    expect(csv).toBe('id,company\n1,"Acme, Inc."')
  })
})
