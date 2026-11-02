import { describe, expect, it } from 'vitest'
import { parseCsv } from './csvTable'

describe('parseCsv', () => {
  it('reads a header and rows', () => {
    expect(parseCsv('name,amount\nA,1\nB,2\n')).toEqual([
      ['name', 'amount'],
      ['A', '1'],
      ['B', '2'],
    ])
  })

  it('keeps commas and quotes inside a quoted field', () => {
    expect(parseCsv('"a,b","say ""hi"""\n')).toEqual([['a,b', 'say "hi"']])
  })

  it('drops a blank trailing row', () => {
    expect(parseCsv('only\n')).toEqual([['only']])
    expect(parseCsv('')).toEqual([])
  })
})
